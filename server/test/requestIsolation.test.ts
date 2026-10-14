import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app, createApp } from '../src/app.js';
import { config } from '../src/config/env.js';
import {
  RequestContext,
  RateLimiterBinding,
  D1Database,
  D1PreparedStatement,
  runWithRequestContext,
  registerRequestContext,
  unregisterRequestContext,
  getRegisteredRequestContext,
  getActiveContextCount,
} from '../src/config/context.js';
import { getClientIp } from '../src/middleware/rateLimiter.js';
import { Client } from 'pg';
import {
  getHyperdriveConnectionString,
  runWithHyperdrive,
  getD1Database,
  runWithD1,
  insertInquiry,
  initDatabase,
  checkDatabaseHealth,
  isDatabaseConnected,
  pool,
} from '../src/config/db.js';

function createMockD1(options?: {
  onPrepare?: (query: string) => void;
  onBind?: (values: unknown[]) => void;
  firstResult?: any;
  shouldFail?: boolean;
  failureError?: Error;
}): D1Database {
  return {
    prepare(query: string) {
      options?.onPrepare?.(query);
      let boundValues: unknown[] = [];
      const statement: D1PreparedStatement = {
        bind(...values: unknown[]) {
          boundValues = values;
          options?.onBind?.(values);
          return statement;
        },
        async first<T = unknown>() {
          if (options?.shouldFail) {
            throw options.failureError || new Error('D1 statement execution failed');
          }
          return (options?.firstResult ?? null) as T;
        },
        async all<T = unknown>() {
          if (options?.shouldFail) {
            throw options.failureError || new Error('D1 statement execution failed');
          }
          return { results: [], success: true };
        },
        async run<T = unknown>() {
          if (options?.shouldFail) {
            throw options.failureError || new Error('D1 statement execution failed');
          }
          return { success: true };
        },
      };
      return statement;
    },
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({}),
  };
}

describe('Request Context Isolation & Safe Fallback Verification', () => {
  let server: http.Server;
  let baseUrl: string;
  let originalResendApiKey: string;

  before(async () => {
    originalResendApiKey = config.resendApiKey;
    config.resendApiKey = '';
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    config.resendApiKey = originalResendApiKey;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('1. Concurrent async tasks maintain strict context isolation without crosstalk', async () => {
    const numRequests = 20;

    const runSimulatedRequest = async (index: number) => {
      const uniqueConn = `postgresql://user_${index}:pass_${index}@hyperdrive-${index}.internal/db_${index}`;
      const uniqueOrigin = `https://client-${index}.example.com`;
      const uniqueApiKey = `resend_key_${index}`;
      const uniqueEnv = index % 2 === 0 ? 'production' : 'development';

      const context: RequestContext = {
        requestId: `req-${index}`,
        hyperdriveConnectionString: uniqueConn,
        corsOrigin: uniqueOrigin,
        resendApiKey: uniqueApiKey,
        nodeEnv: uniqueEnv,
      };

      return runWithRequestContext(context, async () => {
        // Initial check before delay
        assert.strictEqual(getHyperdriveConnectionString(), uniqueConn);
        assert.strictEqual(config.corsOrigin, uniqueOrigin);
        assert.strictEqual(config.resendApiKey, uniqueApiKey);
        assert.strictEqual(config.nodeEnv, uniqueEnv);

        // Simulate asynchronous I/O and interleaved microtasks
        const delayMs = Math.floor(Math.random() * 25) + 5;
        await new Promise((r) => setTimeout(r, delayMs));

        // Re-check after asynchronous resumption
        assert.strictEqual(
          getHyperdriveConnectionString(),
          uniqueConn,
          `Connection string leaked across request boundaries for req-${index}`
        );
        assert.strictEqual(
          config.corsOrigin,
          uniqueOrigin,
          `CORS origin leaked across request boundaries for req-${index}`
        );
        assert.strictEqual(
          config.resendApiKey,
          uniqueApiKey,
          `Resend API key leaked across request boundaries for req-${index}`
        );
        assert.strictEqual(
          config.nodeEnv,
          uniqueEnv,
          `Node env leaked across request boundaries for req-${index}`
        );

        return true;
      });
    };

    const results = await Promise.all(
      Array.from({ length: numRequests }, (_, i) => runSimulatedRequest(i))
    );

    assert.strictEqual(results.length, numRequests);
    assert.ok(results.every(Boolean));
  });

  test('2. Express request pipeline propagates context and strips isolation headers', async () => {
    const testRequestId = `test-worker-req-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      hyperdriveConnectionString: 'postgresql://neon:test@hyperdrive.cloudflare/isolated',
      corsOrigin: 'https://test-isolated.spansol.com',
      resendApiKey: 're_test_isolated_key_123',
      nodeEnv: 'production',
    };

    registerRequestContext(testRequestId, testContext);
    assert.strictEqual(getRegisteredRequestContext(testRequestId), testContext);

    // Make an HTTP request forwarding the worker bridge header
    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: {
        'x-worker-request-id': testRequestId,
        Origin: 'https://test-isolated.spansol.com',
      },
    });

    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.status, 'online');

    // Context should be cleanly cleaned up after response completion
    // Allow brief microtask for finish/close event listeners
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(
      getRegisteredRequestContext(testRequestId),
      undefined,
      'Registered context should be cleaned up after request finish'
    );
  });

  test('3. Missing request context returns null and never falls back to a global mutable variable', () => {
    // Outside any request context
    const connStr = getHyperdriveConnectionString();
    assert.strictEqual(connStr, null, 'Hyperdrive connection string must be null outside context');
  });

  test('4. runWithHyperdrive safely scopes connection string strictly to callback', async () => {
    const scopedConn = 'postgresql://hyperdrive:neon@cloudflare.net/scoped_db';

    const result = await runWithHyperdrive(scopedConn, async () => {
      assert.strictEqual(getHyperdriveConnectionString(), scopedConn);
      await new Promise((r) => setTimeout(r, 10));
      assert.strictEqual(getHyperdriveConnectionString(), scopedConn);
      return 42;
    });

    assert.strictEqual(result, 42);
    // After callback ends, connection string must revert to null
    assert.strictEqual(getHyperdriveConnectionString(), null);
  });

  test('5. Dynamic configuration getters resolve per-request without mutating process.env', async () => {
    const initialProcessEnv = process.env.NODE_ENV;

    const prodContext: RequestContext = {
      nodeEnv: 'production',
      corsOrigin: 'https://production.example.com',
    };

    const devContext: RequestContext = {
      nodeEnv: 'development',
      corsOrigin: 'https://dev.example.com',
    };

    await runWithRequestContext(prodContext, async () => {
      assert.strictEqual(config.nodeEnv, 'production');
      assert.strictEqual(config.corsOrigin, 'https://production.example.com');
      // Verifies process.env was not mutated
      assert.strictEqual(process.env.NODE_ENV, initialProcessEnv);
    });

    await runWithRequestContext(devContext, async () => {
      assert.strictEqual(config.nodeEnv, 'development');
      assert.strictEqual(config.corsOrigin, 'https://dev.example.com');
      assert.strictEqual(process.env.NODE_ENV, initialProcessEnv);
    });

    assert.strictEqual(process.env.NODE_ENV, initialProcessEnv);
  });

  test('6. In simulated worker environment, missing D1 database context fails with explicit error', async () => {
    // Simulate Worker environment flag on globalThis
    (globalThis as any).WebSocketPair = class {};

    try {
      const sampleInquiry = {
        name: 'Isolation Test',
        company: 'Isolation Corp',
        email: 'isolation@example.com',
        phone: '+91 9045085537',
        service: 'Workforce Management Solutions',
      };

      // In Worker runtime without D1 database binding in context
      await assert.rejects(
        async () => {
          await insertInquiry(sampleInquiry);
        },
        {
          name: 'Error',
          message: /No D1 database binding available in the active request context/,
        }
      );
    } finally {
      delete (globalThis as any).WebSocketPair;
    }
  });

  test('7. Local Node.js development mode preserves pool query behavior without context error', async () => {
    // Outside worker runtime and without hyperdrive context:
    // Calling insertInquiry uses local Node.js development execution path (pool / in-memory fallback)
    const sampleInquiry = {
      name: 'Local Test',
      company: 'Local Corp',
      email: 'local@example.com',
      phone: '+91 9045085537',
      service: 'Workforce Management Solutions',
    };

    // Should succeed via local fallback without throwing Hyperdrive context error
    const record = await insertInquiry(sampleInquiry);
    assert.ok(record.id);
    assert.strictEqual(record.name, 'Local Test');
  });

  test('8. Worker request path executes only DML and never executes schema DDL (CREATE/ALTER/DROP)', async () => {
    const originalConnect = Client.prototype.connect;
    const originalQuery = Client.prototype.query;
    const executedQueries: string[] = [];

    try {
      Client.prototype.connect = async function () {
        return undefined as any;
      };
      Client.prototype.query = (async function (queryText: any, values: any[]) {
        const sql = typeof queryText === 'string' ? queryText : queryText?.text || '';
        executedQueries.push(sql);
        return {
          rows: [
            {
              id: 888,
              name: 'DDL Test',
              company: 'SPAN Test Corp',
              email: 'ddl@test.example.com',
              phone: '+91 9045085537',
              state: 'Uttarakhand',
              city: 'Rudrapur',
              service: 'Workforce Management Solutions',
              message: 'Testing that no DDL runs on worker path.',
              created_at: new Date().toISOString(),
            },
          ],
        };
      }) as any;

      const sampleInquiry = {
        name: 'DDL Test',
        company: 'SPAN Test Corp',
        email: 'ddl@test.example.com',
        phone: '+91 9045085537',
        state: 'Uttarakhand',
        city: 'Rudrapur',
        service: 'Workforce Management Solutions',
        message: 'Testing that no DDL runs on worker path.',
      };

      // Run within a Hyperdrive request context
      const scopedConn = 'postgresql://hyperdrive:neon@cloudflare.net/scoped_db';
      const record = await runWithHyperdrive(scopedConn, async () => {
        return await insertInquiry(sampleInquiry);
      });

      assert.strictEqual(record.id, 888);
      assert.strictEqual(executedQueries.length, 1, 'Worker request should execute exactly 1 database query');

      // Assert that the executed query is an INSERT
      assert.ok(
        /INSERT\s+INTO\s+inquiries/i.test(executedQueries[0]),
        'Worker request must execute an INSERT query'
      );

      // Assert that no DDL queries were executed
      assert.ok(
        !executedQueries.some((q) => /CREATE\s+TABLE/i.test(q)),
        'Worker request must not execute CREATE TABLE'
      );
      assert.ok(
        !executedQueries.some((q) => /CREATE\s+INDEX/i.test(q)),
        'Worker request must not execute CREATE INDEX'
      );
      assert.ok(
        !executedQueries.some((q) => /ALTER\s+TABLE/i.test(q)),
        'Worker request must not execute ALTER TABLE'
      );
      assert.ok(
        !executedQueries.some((q) => /DROP/i.test(q)),
        'Worker request must not execute DROP'
      );
    } finally {
      Client.prototype.connect = originalConnect;
      Client.prototype.query = originalQuery;
    }
  });

  test('9. Local development initDatabase executes schema initialization without errors', async () => {
    const originalPoolConnect = pool.connect;
    const executedLocalQueries: string[] = [];

    try {
      pool.connect = (async () => ({
        query: async (queryText: string) => {
          executedLocalQueries.push(queryText);
          return { rows: [] };
        },
        release: () => {},
      })) as any;

      await initDatabase();
      assert.ok(executedLocalQueries.length > 0, 'initDatabase should execute local schema setup');
      assert.ok(
        executedLocalQueries.some((q) => /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+inquiries/i.test(q)),
        'initDatabase should define inquiries table for local development'
      );
      assert.ok(
        executedLocalQueries.some((q) => /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/i.test(q)),
        'initDatabase should define indexes for local development'
      );
    } finally {
      pool.connect = originalPoolConnect;
    }
  });

  test('10. Migration 001_create_inquiries.sql exists and contains idempotent schema definition', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const candidates = [
      path.resolve(process.cwd(), 'server/migrations/001_create_inquiries.sql'),
      path.resolve(process.cwd(), 'migrations/001_create_inquiries.sql'),
      path.resolve(__dirname, '../migrations/001_create_inquiries.sql'),
    ];
    const targetPath = candidates.find((p) => fs.existsSync(p));

    assert.ok(targetPath, '001_create_inquiries.sql must exist');
    const content = fs.readFileSync(targetPath!, 'utf8');

    // Verify all required table columns
    assert.ok(content.includes('id SERIAL PRIMARY KEY'));
    assert.ok(content.includes('name VARCHAR(150) NOT NULL'));
    assert.ok(content.includes('company VARCHAR(150) NOT NULL'));
    assert.ok(content.includes('email VARCHAR(255) NOT NULL'));
    assert.ok(content.includes('phone VARCHAR(50) NOT NULL'));
    assert.ok(content.includes('state VARCHAR(100)'));
    assert.ok(content.includes('city VARCHAR(100)'));
    assert.ok(content.includes('service VARCHAR(100) NOT NULL'));
    assert.ok(content.includes('message TEXT'));
    assert.ok(content.includes('created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'));

    // Verify indexes
    assert.ok(content.includes('idx_inquiries_email'));
    assert.ok(content.includes('idx_inquiries_service'));
    assert.ok(content.includes('idx_inquiries_created_at'));
  });

  test('11. Database health probe via Hyperdrive executes SELECT 1 and returns healthy', async () => {
    const originalConnect = Client.prototype.connect;
    const originalQuery = Client.prototype.query;
    const originalEnd = Client.prototype.end;
    const executedQueries: string[] = [];
    let endCalled = false;

    try {
      Client.prototype.connect = async function () {
        return undefined as any;
      };
      Client.prototype.query = (async function (queryText: any) {
        const sql = typeof queryText === 'string' ? queryText : queryText?.text || '';
        executedQueries.push(sql);
        return { rows: [{ '?column?': 1 }] };
      }) as any;
      Client.prototype.end = (async function () {
        endCalled = true;
      }) as any;

      const testRequestId = `test-health-worker-${Date.now()}`;
      const testContext: RequestContext = {
        requestId: testRequestId,
        hyperdriveConnectionString: 'postgresql://neon:test@hyperdrive.cloudflare/isolated',
        nodeEnv: 'production',
      };

      registerRequestContext(testRequestId, testContext);

      const response = await fetch(`${baseUrl}/api/health`, {
        headers: {
          'x-worker-request-id': testRequestId,
        },
      });

      assert.strictEqual(response.status, 200);
      const json = (await response.json()) as any;
      assert.strictEqual(json.status, 'healthy');
      assert.strictEqual(json.database, 'connected');
      assert.strictEqual(json.company, 'SPAN Industrial Solutions Pvt Ltd');
      assert.ok(json.timestamp);

      // Verify SELECT 1 was executed and client was closed safely
      assert.strictEqual(executedQueries.length, 1);
      assert.strictEqual(executedQueries[0], 'SELECT 1');
      assert.strictEqual(endCalled, true, 'Client must be closed in finally');
    } finally {
      Client.prototype.connect = originalConnect;
      Client.prototype.query = originalQuery;
      Client.prototype.end = originalEnd;
    }
  });

  test('12. Database health probe via Hyperdrive handles query failure safely without exposing internal errors', async () => {
    const originalConnect = Client.prototype.connect;
    const originalQuery = Client.prototype.query;
    const originalEnd = Client.prototype.end;
    let endCalled = false;

    try {
      Client.prototype.connect = async function () {
        return undefined as any;
      };
      Client.prototype.query = (async function () {
        throw new Error('SecretNeonCredentialsDatabaseError: connection terminated unexpectedly');
      }) as any;
      Client.prototype.end = (async function () {
        endCalled = true;
      }) as any;

      const testRequestId = `test-health-fail-${Date.now()}`;
      const testContext: RequestContext = {
        requestId: testRequestId,
        hyperdriveConnectionString: 'postgresql://user:secret_password@hyperdrive.internal/prod_db',
        nodeEnv: 'production',
      };

      registerRequestContext(testRequestId, testContext);

      const response = await fetch(`${baseUrl}/api/health`, {
        headers: {
          'x-worker-request-id': testRequestId,
        },
      });

      assert.strictEqual(response.status, 503, 'Must return 503 when database query fails in production');
      const json = (await response.json()) as any;
      assert.strictEqual(json.status, 'degraded');
      assert.strictEqual(json.database, 'disconnected');
      assert.strictEqual(json.company, 'SPAN Industrial Solutions Pvt Ltd');

      // Verify credentials and internal errors are never exposed in the response
      const rawText = JSON.stringify(json);
      assert.ok(!rawText.includes('secret_password'));
      assert.ok(!rawText.includes('SecretNeonCredentialsDatabaseError'));
      assert.strictEqual(endCalled, true, 'Client must be closed on query failure');
    } finally {
      Client.prototype.connect = originalConnect;
      Client.prototype.query = originalQuery;
      Client.prototype.end = originalEnd;
    }
  });

  test('13. Health probe executes zero DDL statements', async () => {
    const originalConnect = Client.prototype.connect;
    const originalQuery = Client.prototype.query;
    const executedQueries: string[] = [];

    try {
      Client.prototype.connect = async function () {
        return undefined as any;
      };
      Client.prototype.query = (async function (queryText: any) {
        const sql = typeof queryText === 'string' ? queryText : queryText?.text || '';
        executedQueries.push(sql);
        return { rows: [{ '?column?': 1 }] };
      }) as any;

      const scopedConn = 'postgresql://hyperdrive:neon@cloudflare.net/scoped_db';
      const healthy = await runWithHyperdrive(scopedConn, async () => {
        return await checkDatabaseHealth();
      });

      assert.strictEqual(healthy, true);
      assert.strictEqual(executedQueries.length, 1);
      assert.strictEqual(executedQueries[0], 'SELECT 1');
      assert.ok(!executedQueries.some((q) => /CREATE/i.test(q)));
      assert.ok(!executedQueries.some((q) => /ALTER/i.test(q)));
      assert.ok(!executedQueries.some((q) => /DROP/i.test(q)));
    } finally {
      Client.prototype.connect = originalConnect;
      Client.prototype.query = originalQuery;
    }
  });

  test('14. Health check in worker runtime without D1 database binding reports degraded safely', async () => {
    (globalThis as any).WebSocketPair = class {};

    try {
      const healthy = await checkDatabaseHealth();
      assert.strictEqual(healthy, false, 'Without D1 database binding in worker runtime, health probe must return false');
    } finally {
      delete (globalThis as any).WebSocketPair;
    }
  });

  test('15. Cloudflare rate limiter: Requests below limit succeed and pass through to route handler', async () => {
    let limitKeyCalled = '';
    const mockLimiter: RateLimiterBinding = {
      async limit(options) {
        limitKeyCalled = options.key;
        return { success: true };
      },
    };

    const testRequestId = `test-rl-below-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      clientIp: '198.51.100.10',
      inquiryRateLimiter: mockLimiter,
      nodeEnv: 'development',
    };

    registerRequestContext(testRequestId, testContext);

    const response = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-request-id': testRequestId,
      },
      body: JSON.stringify({}), // empty body fails validation (400), proving rate limiter allowed it through
    });

    assert.strictEqual(limitKeyCalled, '198.51.100.10', 'Rate limiter must be called with trusted client IP');
    assert.strictEqual(response.status, 400, 'Request below limit must pass through rate limiter to controller');
    const json = (await response.json()) as any;
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.message, 'Please resolve the highlighted errors before submitting.');
  });

  test('16. Cloudflare rate limiter: Requests exceeding limit return HTTP 429 with established error message', async () => {
    let limitCalled = false;
    const mockLimiter: RateLimiterBinding = {
      async limit() {
        limitCalled = true;
        return { success: false };
      },
    };

    const testRequestId = `test-rl-over-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      clientIp: '198.51.100.20',
      inquiryRateLimiter: mockLimiter,
      nodeEnv: 'production',
    };

    registerRequestContext(testRequestId, testContext);

    const response = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-request-id': testRequestId,
      },
      body: JSON.stringify({ name: 'Blocked User' }),
    });

    assert.strictEqual(limitCalled, true, 'Rate limiter must be invoked');
    assert.strictEqual(response.status, 429, 'Rate limited request must return HTTP 429');
    const json = (await response.json()) as any;
    assert.strictEqual(json.success, false);
    assert.strictEqual(
      json.message,
      'Too many inquiries submitted from this connection. Please try again after 15 minutes or reach us directly at INFOSPAN.UKD@gmail.com.'
    );
  });

  test('17. Cloudflare rate limiter: Correct client-IP key selection ignores untrusted client headers', async () => {
    let capturedKey = '';
    const mockLimiter: RateLimiterBinding = {
      async limit(options) {
        capturedKey = options.key;
        return { success: true };
      },
    };

    const testRequestId = `test-rl-ip-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      clientIp: '203.0.113.88', // Trusted IP from Worker's CF-Connecting-IP
      inquiryRateLimiter: mockLimiter,
    };

    registerRequestContext(testRequestId, testContext);

    // Client attempts to spoof IP via X-Forwarded-For or CF-Connecting-IP HTTP headers
    await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-request-id': testRequestId,
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        'cf-connecting-ip': '9.9.9.9',
      },
      body: JSON.stringify({}),
    });

    assert.strictEqual(
      capturedKey,
      '203.0.113.88',
      'Rate limiter must use trusted clientIp from RequestContext, not client headers'
    );
  });

  test('18. Cloudflare rate limiter: Missing-IP behavior safely uses fallback and handles binding errors gracefully', async () => {
    let capturedKey = '';
    const mockLimiter: RateLimiterBinding = {
      async limit(options) {
        capturedKey = options.key;
        return { success: false };
      },
    };

    const testRequestId = `test-rl-missing-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      clientIp: undefined, // Missing CF-Connecting-IP
      inquiryRateLimiter: mockLimiter,
    };

    registerRequestContext(testRequestId, testContext);

    const response = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-request-id': testRequestId,
      },
      body: JSON.stringify({}),
    });

    assert.strictEqual(capturedKey, 'unknown', 'Missing IP must safely fall back to "unknown"');
    assert.strictEqual(response.status, 429);

    // Also test binding failure fail-open behavior
    const failingLimiter: RateLimiterBinding = {
      async limit() {
        throw new Error('Cloudflare internal rate limiter service unavailable');
      },
    };

    const failRequestId = `test-rl-failopen-${Date.now()}`;
    registerRequestContext(failRequestId, {
      requestId: failRequestId,
      clientIp: '198.51.100.99',
      inquiryRateLimiter: failingLimiter,
    });

    const failResponse = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-request-id': failRequestId,
      },
      body: JSON.stringify({}),
    });

    assert.strictEqual(
      failResponse.status,
      400,
      'When rate limiter binding fails unexpectedly, system must fail open to allow legitimate requests'
    );
  });

  test('19. Cloudflare rate limiter: CORS headers are preserved on rate-limited HTTP 429 responses', async () => {
    const mockLimiter: RateLimiterBinding = {
      async limit() {
        return { success: false };
      },
    };

    const allowedOrigin = 'https://portal.spansol.com';
    const testRequestId = `test-rl-cors-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      clientIp: '198.51.100.55',
      corsOrigin: allowedOrigin,
      nodeEnv: 'production',
      inquiryRateLimiter: mockLimiter,
    };

    registerRequestContext(testRequestId, testContext);

    const response = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-request-id': testRequestId,
        Origin: allowedOrigin,
      },
      body: JSON.stringify({}),
    });

    assert.strictEqual(response.status, 429, 'Must return 429');
    assert.strictEqual(
      response.headers.get('access-control-allow-origin'),
      allowedOrigin,
      'CORS origin header must be present on rate-limited 429 response'
    );
    const json = (await response.json()) as any;
    assert.strictEqual(json.success, false);
    assert.ok(json.message.includes('Too many inquiries submitted'));
  });

  test('20. Rate limiter: Local Node.js rate limiting falls back to direct connection IP', () => {
    // Outside of Worker context (RequestContext undefined)
    const mockReqNode = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      headers: {},
    } as any;

    const resolvedIp = getClientIp(mockReqNode);
    assert.strictEqual(resolvedIp, '127.0.0.1', 'Node.js runtime must fall back to req.ip or socket address');
  });

  test('21. Rate limiter: Express in-memory limiter isolates visitor IPs in Worker context rather than sharing internal bridge IP', () => {
    const mockReqBridge = {
      ip: '127.0.0.1', // Internal bridge IP
      socket: { remoteAddress: '127.0.0.1' },
      headers: {},
    } as any;

    // Visitor A
    const ipA = runWithRequestContext({ clientIp: '198.51.100.1' }, () => getClientIp(mockReqBridge));
    // Visitor B
    const ipB = runWithRequestContext({ clientIp: '198.51.100.2' }, () => getClientIp(mockReqBridge));

    assert.strictEqual(ipA, '198.51.100.1', 'Visitor A must be identified by their own IP');
    assert.strictEqual(ipB, '198.51.100.2', 'Visitor B must be identified by their own IP');
    assert.notStrictEqual(ipA, ipB, 'Different visitors must not share the bridge loopback IP');
  });

  test('22. Worker initialization: Worker app initializes without creating global-scope timers or rate-limit intervals', () => {
    const originalSetInterval = global.setInterval;
    let setIntervalCalled = false;

    try {
      global.setInterval = ((...args: any[]) => {
        setIntervalCalled = true;
        return (originalSetInterval as any)(...args);
      }) as any;

      // Simulate worker environment
      (globalThis as any).WebSocketPair = class WebSocketPair {};

      const workerApp = createApp({ isWorker: true });
      assert.ok(workerApp, 'Worker app must be instantiated');
      assert.strictEqual(
        setIntervalCalled,
        false,
        'Worker initialization must not invoke setInterval or create timer stores'
      );
    } finally {
      global.setInterval = originalSetInterval;
      delete (globalThis as any).WebSocketPair;
    }
  });

  test('23. Worker rate limiting: Request without binding in worker context passes through safely to route handler', async () => {
    const testRequestId = `test-worker-nobinding-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      clientIp: '198.51.100.77',
      // No inquiryRateLimiter binding provided
      nodeEnv: 'production',
    };

    registerRequestContext(testRequestId, testContext);

    const response = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-request-id': testRequestId,
      },
      body: JSON.stringify({}), // Empty payload fails validation (400), proving it reached validation
    });

    assert.strictEqual(
      response.status,
      400,
      'When rate limiter binding is absent in worker context, route must safely process validation'
    );
  });

  test('24. D1 Migration 0001_create_inquiries.sql exists and contains SQLite-compatible schema definition', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const candidates = [
      path.resolve(process.cwd(), 'server/migrations/d1/0001_create_inquiries.sql'),
      path.resolve(process.cwd(), 'migrations/d1/0001_create_inquiries.sql'),
      path.resolve(__dirname, '../migrations/d1/0001_create_inquiries.sql'),
    ];
    const targetPath = candidates.find((p) => fs.existsSync(p));

    assert.ok(targetPath, '0001_create_inquiries.sql must exist in D1 migrations directory');
    const content = fs.readFileSync(targetPath!, 'utf8');

    // Verify all required SQLite table columns and types
    assert.ok(content.includes('id INTEGER PRIMARY KEY AUTOINCREMENT'));
    assert.ok(content.includes('name TEXT NOT NULL'));
    assert.ok(content.includes('company TEXT NOT NULL'));
    assert.ok(content.includes('email TEXT NOT NULL'));
    assert.ok(content.includes('phone TEXT NOT NULL'));
    assert.ok(content.includes('state TEXT'));
    assert.ok(content.includes('city TEXT'));
    assert.ok(content.includes('service TEXT NOT NULL'));
    assert.ok(content.includes('message TEXT'));
    assert.ok(content.includes('created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP'));

    // Verify indexes
    assert.ok(content.includes('idx_inquiries_email'));
    assert.ok(content.includes('idx_inquiries_service'));
    assert.ok(content.includes('idx_inquiries_created_at'));
  });

  test('25. Database health probe via D1 executes SELECT 1 and returns healthy', async () => {
    let executedQuery = '';
    const mockD1 = createMockD1({
      onPrepare(query) {
        executedQuery = query;
      },
      firstResult: { 1: 1 },
    });

    const testRequestId = `test-d1-health-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      d1Database: mockD1,
      nodeEnv: 'production',
    };

    registerRequestContext(testRequestId, testContext);

    const response = await fetch(`${baseUrl}/api/health`, {
      headers: {
        'x-worker-request-id': testRequestId,
      },
    });

    assert.strictEqual(response.status, 200);
    const json = (await response.json()) as any;
    assert.strictEqual(json.status, 'healthy');
    assert.strictEqual(json.database, 'connected');
    assert.strictEqual(json.company, 'SPAN Industrial Solutions Pvt Ltd');
    assert.strictEqual(executedQuery.trim(), 'SELECT 1');
  });

  test('26. Database health probe via D1 handles query failure safely without exposing errors', async () => {
    const mockD1 = createMockD1({
      shouldFail: true,
      failureError: new Error('D1DatabaseInternalError: disk I/O error on sensitive_cluster_id'),
    });

    const testRequestId = `test-d1-health-fail-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      d1Database: mockD1,
      nodeEnv: 'production',
    };

    registerRequestContext(testRequestId, testContext);

    const response = await fetch(`${baseUrl}/api/health`, {
      headers: {
        'x-worker-request-id': testRequestId,
      },
    });

    assert.strictEqual(response.status, 503, 'Must return 503 when D1 health probe fails in production');
    const json = (await response.json()) as any;
    assert.strictEqual(json.status, 'degraded');
    assert.strictEqual(json.database, 'disconnected');
    const raw = JSON.stringify(json);
    assert.ok(!raw.includes('sensitive_cluster_id'));
    assert.ok(!raw.includes('D1DatabaseInternalError'));
  });

  test('27. Worker inquiry insert via D1 executes prepared statement with bound parameters', async () => {
    let preparedQuery = '';
    let boundValues: unknown[] = [];

    const mockRecord = {
      id: 501,
      name: 'Ashok Leyland Supply Division',
      company: 'Leyland Operations',
      email: 'ashok@leyland.example.com',
      phone: '+91 9045085537',
      state: 'Uttarakhand',
      city: 'Pantnagar',
      service: 'Workforce Management Solutions',
      message: 'Staffing for assembly shifts',
      created_at: new Date().toISOString(),
    };

    const mockD1 = createMockD1({
      onPrepare(query) {
        preparedQuery = query;
      },
      onBind(values) {
        boundValues = values;
      },
      firstResult: mockRecord,
    });

    const sampleInquiry = {
      name: 'Ashok Leyland Supply Division',
      company: 'Leyland Operations',
      email: 'ashok@leyland.example.com',
      phone: '+91 9045085537',
      state: 'Uttarakhand',
      city: 'Pantnagar',
      service: 'Workforce Management Solutions' as const,
      message: 'Staffing for assembly shifts',
    };

    const result = await runWithD1(mockD1, async () => {
      return await insertInquiry(sampleInquiry);
    });

    assert.strictEqual(result.id, 501);
    assert.strictEqual(result.name, sampleInquiry.name);

    // Verify prepared statement uses ? placeholders (never concatenated user input)
    assert.ok(
      preparedQuery.includes('VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
      'Prepared statement must use parameterized ? placeholders'
    );
    assert.ok(
      preparedQuery.includes('RETURNING id, name, company, email, phone, state, city, service, message, created_at'),
      'Prepared statement must include RETURNING clause'
    );
    assert.ok(
      !preparedQuery.includes('Ashok Leyland'),
      'Query string must not contain concatenated user values'
    );

    // Verify bound values match inquiry inputs exactly
    assert.strictEqual(boundValues.length, 8);
    assert.strictEqual(boundValues[0], sampleInquiry.name);
    assert.strictEqual(boundValues[1], sampleInquiry.company);
    assert.strictEqual(boundValues[2], sampleInquiry.email);
    assert.strictEqual(boundValues[3], sampleInquiry.phone);
    assert.strictEqual(boundValues[4], sampleInquiry.state);
    assert.strictEqual(boundValues[5], sampleInquiry.city);
    assert.strictEqual(boundValues[6], sampleInquiry.service);
    assert.strictEqual(boundValues[7], sampleInquiry.message);
  });

  test('28. Worker inquiry submission via HTTP POST /api/inquiries succeeds with HTTP 201 using D1', async () => {
    const mockRecord = {
      id: 502,
      name: 'Priya Sharma',
      company: 'Precision Components Pvt Ltd',
      email: 'priya@precision.example.com',
      phone: '+91 9045085537',
      state: 'Uttarakhand',
      city: 'Rudrapur',
      service: 'Guaranteed Saving Program',
      message: 'Cost optimization request',
      created_at: new Date().toISOString(),
    };

    const mockD1 = createMockD1({
      firstResult: mockRecord,
    });

    const testRequestId = `test-d1-post-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      d1Database: mockD1,
      nodeEnv: 'production',
    };

    registerRequestContext(testRequestId, testContext);

    const payload = {
      name: 'Priya Sharma',
      company: 'Precision Components Pvt Ltd',
      email: 'priya@precision.example.com',
      phone: '+91 9045085537',
      state: 'Uttarakhand',
      city: 'Rudrapur',
      service: 'Guaranteed Saving Program',
      message: 'Cost optimization request',
    };

    const response = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-request-id': testRequestId,
      },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(response.status, 201);
    const json = (await response.json()) as any;
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.id, 502);
    assert.strictEqual(json.data.name, 'Priya Sharma');
  });

  test('29. D1 insertion failure in production returns HTTP 503 and never HTTP 201', async () => {
    const mockD1 = createMockD1({
      shouldFail: true,
      failureError: new Error('D1DatabaseInternalError: simulated insert failure'),
    });

    const testRequestId = `test-d1-fail-${Date.now()}`;
    const testContext: RequestContext = {
      requestId: testRequestId,
      d1Database: mockD1,
      nodeEnv: 'production',
    };

    registerRequestContext(testRequestId, testContext);

    const payload = {
      name: 'Priya Sharma',
      company: 'Precision Components Pvt Ltd',
      email: 'priya@precision.example.com',
      phone: '+91 9045085537',
      service: 'Guaranteed Saving Program',
    };

    const response = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-request-id': testRequestId,
      },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(response.status, 503, 'Must return 503 on database failure in production');
    const json = (await response.json()) as any;
    assert.strictEqual(json.success, false);
    assert.ok(json.message.includes('unavailable'));
  });

  test('30. Concurrent requests with isolated D1 bindings do not crosstalk', async () => {
    const numRequests = 15;
    const executionLogs: Record<string, number> = {};

    const runRequest = async (index: number) => {
      const reqId = `d1-iso-${index}-${Date.now()}`;
      const mockD1 = createMockD1({
        firstResult: {
          id: 1000 + index,
          name: `Client ${index}`,
          company: `Company ${index}`,
          email: `client${index}@example.com`,
          phone: '+91 9045085537',
          service: 'Workforce Management Solutions',
          created_at: new Date().toISOString(),
        },
      });

      return runWithD1(mockD1, async () => {
        const d1InContext = getD1Database();
        assert.strictEqual(d1InContext, mockD1);

        const delay = Math.floor(Math.random() * 20) + 5;
        await new Promise((r) => setTimeout(r, delay));

        const postDelayD1 = getD1Database();
        assert.strictEqual(
          postDelayD1,
          mockD1,
          `D1 context leaked across async boundary for request ${index}`
        );

        const record = await insertInquiry({
          name: `Client ${index}`,
          company: `Company ${index}`,
          email: `client${index}@example.com`,
          phone: '+91 9045085537',
          service: 'Workforce Management Solutions',
        });

        assert.strictEqual(record.id, 1000 + index);
        executionLogs[reqId] = record.id;
        return true;
      });
    };

    const results = await Promise.all(
      Array.from({ length: numRequests }, (_, i) => runRequest(i))
    );
    assert.strictEqual(results.length, numRequests);
    assert.strictEqual(Object.keys(executionLogs).length, numRequests);
  });

  test('31. Worker runtime does not use DATABASE_URL or initialize Hyperdrive', async () => {
    (globalThis as any).WebSocketPair = class {};
    const originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://should_never_be_accessed:5432/blocked';

    let d1Executed = false;
    const mockD1 = createMockD1({
      onPrepare() {
        d1Executed = true;
      },
      firstResult: {
        id: 777,
        name: 'Worker Isolation',
        company: 'Worker Corp',
        email: 'worker@example.com',
        phone: '+91 9045085537',
        service: 'Workforce Management Solutions',
        created_at: new Date().toISOString(),
      },
    });

    try {
      const record = await runWithD1(mockD1, async () => {
        return await insertInquiry({
          name: 'Worker Isolation',
          company: 'Worker Corp',
          email: 'worker@example.com',
          phone: '+91 9045085537',
          service: 'Workforce Management Solutions',
        });
      });

      assert.strictEqual(record.id, 777);
      assert.strictEqual(d1Executed, true, 'Worker execution must use D1 database');
    } finally {
      process.env.DATABASE_URL = originalDatabaseUrl;
      delete (globalThis as any).WebSocketPair;
    }
  });

  test('32. Local Node.js development mode preserves PostgreSQL pool & in-memory fallback when D1 is absent', async () => {
    // Outside worker runtime and without D1 database in context
    const sampleInquiry = {
      name: 'Local Node Fallback',
      company: 'Local Node Corp',
      email: 'localnode@example.com',
      phone: '+91 9045085537',
      service: 'Workforce Management Solutions' as const,
    };

    const record = await insertInquiry(sampleInquiry);
    assert.ok(record.id, 'Record must be assigned an ID via local pool / in-memory fallback');
    assert.strictEqual(record.name, 'Local Node Fallback');
  });
});
