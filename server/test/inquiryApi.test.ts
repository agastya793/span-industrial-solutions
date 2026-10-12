import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import { pool, initDatabase, insertInquiry, isDatabaseConnected } from '../src/config/db.js';
import { config } from '../src/config/env.js';
import inquiryRoutes from '../src/routes/inquiryRoutes.js';
import healthRoutes from '../src/routes/healthRoutes.js';
import { inquiryRateLimiter } from '../src/middleware/rateLimiter.js';
import {
  generateInquiryEmailHtml,
  generateInquiryEmailText,
  sendInquiryNotificationEmail,
} from '../src/services/emailService.js';

describe('Inquiry API & Database Failure Handling (Real Application Code)', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;

  // Store original methods and environment
  const originalPoolQuery = pool.query;
  const originalPoolConnect = pool.connect;
  const originalNodeEnv = config.nodeEnv;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  // Buffer to capture log output for sensitive data exposure verification
  let capturedLogs: string[] = [];

  before(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/inquiries', inquiryRoutes);
    app.use('/api/health', healthRoutes);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    config.nodeEnv = originalNodeEnv;
    pool.query = originalPoolQuery;
    pool.connect = originalPoolConnect;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  beforeEach(() => {
    capturedLogs = [];
    console.error = (...args: unknown[]) => {
      capturedLogs.push(args.map(String).join(' '));
    };
    console.log = (...args: unknown[]) => {
      capturedLogs.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    config.nodeEnv = originalNodeEnv;
    pool.query = originalPoolQuery;
    pool.connect = originalPoolConnect;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  const validPayload = {
    name: 'Rajesh Sharma',
    company: 'Apex Industrial Gears Ltd',
    email: 'rajesh.sharma@apexgears.example.com',
    phone: '+91 9045085537',
    state: 'Uttarakhand',
    city: 'Rudrapur',
    service: 'Workforce Management Solutions',
    message: 'We require 25 skilled CNC operators for our Rudrapur plant operations.',
  };

  test('Scenario 1: Valid inquiry returns HTTP 201 only after persistence succeeds', async () => {
    config.nodeEnv = 'production';

    // Simulate successful database connectivity and query persistence
    pool.connect = (async () => ({
      query: async () => {},
      release: () => {},
    })) as any;

    await initDatabase();
    assert.strictEqual(isDatabaseConnected(), true, 'Database should be marked connected');

    pool.query = (async (_queryText: string, values: any[]) => {
      return {
        rows: [
          {
            id: 101,
            name: values[0],
            company: values[1],
            email: values[2],
            phone: values[3],
            state: values[4],
            city: values[5],
            service: values[6],
            message: values[7],
            created_at: new Date().toISOString(),
          },
        ],
      };
    }) as any;

    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    assert.strictEqual(res.status, 201, 'Should respond with HTTP 201 Created');
    const json = (await res.json()) as any;
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.id, 101, 'Persisted record ID must match');
    assert.strictEqual(json.data.company, validPayload.company);
  });

  test('Scenario 2: When database is unavailable in production, inquiry returns HTTP 503', async () => {
    config.nodeEnv = 'production';

    // Force database connection failure
    pool.connect = (async () => {
      throw new Error('Connection refused to database');
    }) as any;

    await initDatabase();
    assert.strictEqual(isDatabaseConnected(), false, 'Database must be disconnected');

    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    assert.strictEqual(res.status, 503, 'Should respond with HTTP 503 Service Unavailable');
    const json = (await res.json()) as any;
    assert.strictEqual(json.success, false);
    assert.ok(json.message.includes('unavailable'), 'User message must clearly state temporary unavailability');
    assert.strictEqual(json.data, undefined, 'No data object should be returned on failure');
  });

  test('Scenario 3: When database write fails during submission, returns HTTP 503 and never 201', async () => {
    config.nodeEnv = 'production';

    pool.connect = (async () => ({
      query: async () => {},
      release: () => {},
    })) as any;

    await initDatabase();

    // Query execution throws an error (e.g. disk failure or broken pipe)
    pool.query = (async () => {
      throw new Error('fatal: disk quota exceeded on database volume');
    }) as any;

    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    assert.strictEqual(res.status, 503, 'Must return HTTP 503');
    assert.notStrictEqual(res.status, 201, 'Must NEVER return HTTP 201 on write failure');
    const json = (await res.json()) as any;
    assert.strictEqual(json.success, false);
  });

  test('Scenario 4: Production mode never writes inquiries to in-memory fallback', async () => {
    config.nodeEnv = 'production';

    pool.connect = (async () => {
      throw new Error('PostgreSQL unavailable');
    }) as any;

    await initDatabase();

    // Direct invocation of persistence layer in production
    await assert.rejects(
      async () => {
        await insertInquiry(validPayload as any);
      },
      (err: Error) => {
        assert.ok(
          err.message.includes('unavailable') || err.message.includes('failed'),
          'Must throw a failure error instead of returning memory record'
        );
        return true;
      }
    );
  });

  test('Scenario 5: Errors and logs do not expose database credentials, customer emails, or message body', async () => {
    config.nodeEnv = 'production';

    pool.connect = (async () => {
      throw new Error('Connection failed: postgresql://admin:supersecret@10.0.0.1:5432/spandb');
    }) as any;

    await initDatabase();

    const sensitiveMessage = 'CONFIDENTIAL_REQUIREMENT_DETAILS_DO_NOT_LEAK';
    const testEmail = 'confidential.client@secretcorp.example.com';

    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validPayload,
        email: testEmail,
        message: sensitiveMessage,
      }),
    });

    const responseText = await res.text();
    const allCapturedLogs = capturedLogs.join('\n');

    // 5a. Response must not leak sensitive info
    assert.strictEqual(responseText.includes('supersecret'), false, 'Response must not contain DB password');
    assert.strictEqual(responseText.includes('postgres://'), false, 'Response must not contain DB connection string');
    assert.strictEqual(responseText.includes(testEmail), false, 'Response must not leak email in error body');
    assert.strictEqual(responseText.includes(sensitiveMessage), false, 'Response must not leak message content in error body');

    // 5b. Logs must not leak customer email or message body
    assert.strictEqual(allCapturedLogs.includes(testEmail), false, 'Server logs must not contain customer email');
    assert.strictEqual(allCapturedLogs.includes(sensitiveMessage), false, 'Server logs must not contain inquiry message content');
  });

  test('Scenario 6: Existing input validation and rate limiting behavior remain intact', async () => {
    // 6a. Missing required fields
    const resEmpty = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.strictEqual(resEmpty.status, 400, 'Empty submission must return HTTP 400');
    const jsonEmpty = (await resEmpty.json()) as any;
    assert.strictEqual(jsonEmpty.success, false);
    assert.ok(jsonEmpty.errors.name, 'Validation errors must flag missing name');
    assert.ok(jsonEmpty.errors.company, 'Validation errors must flag missing company');
    assert.ok(jsonEmpty.errors.email, 'Validation errors must flag missing email');
    assert.ok(jsonEmpty.errors.phone, 'Validation errors must flag missing phone');
    assert.ok(jsonEmpty.errors.service, 'Validation errors must flag missing service');

    // 6b. Invalid service selection
    const resBadService = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validPayload,
        service: 'NonExistentServiceVertical',
      }),
    });

    assert.strictEqual(resBadService.status, 400);
    const jsonBadService = (await resBadService.json()) as any;
    assert.ok(jsonBadService.errors.service, 'Must flag invalid service selection');

    // 6c. Standard rate limit headers present
    assert.ok(
      resEmpty.headers.has('ratelimit-limit') || resEmpty.headers.has('x-ratelimit-limit'),
      'Rate limit headers must be present on inquiry route'
    );
  });

  test('Scenario 7: Health check endpoint accurately reflects database state', async () => {
    // 7a. Health check when connected
    config.nodeEnv = 'production';
    pool.connect = (async () => ({
      query: async () => {},
      release: () => {},
    })) as any;

    await initDatabase();
    const resUp = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(resUp.status, 200);
    const jsonUp = (await resUp.json()) as any;
    assert.strictEqual(jsonUp.status, 'healthy');
    assert.strictEqual(jsonUp.database, 'connected');

    // 7b. Health check when disconnected in production
    pool.connect = (async () => {
      throw new Error('Connection refused');
    }) as any;

    await initDatabase();
    const resDown = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(resDown.status, 503, 'Health check must return 503 when DB down in production');
    const jsonDown = (await resDown.json()) as any;
    assert.strictEqual(jsonDown.status, 'degraded');
    assert.strictEqual(jsonDown.database, 'disconnected');
  });

  test('Scenario 8: Frontend Contact form payload with location prefix is properly processed and persisted', async () => {
    config.nodeEnv = 'production';

    pool.connect = (async () => ({
      query: async () => {},
      release: () => {},
    })) as any;

    await initDatabase();

    let capturedValues: any[] = [];
    pool.query = (async (_queryText: string, values: any[]) => {
      capturedValues = values;
      return {
        rows: [
          {
            id: 202,
            name: values[0],
            company: values[1],
            email: values[2],
            phone: values[3],
            state: values[4],
            city: values[5],
            service: values[6],
            message: values[7],
            created_at: new Date().toISOString(),
          },
        ],
      };
    }) as any;

    // Payload exactly matching Contact.tsx handleSubmit() lines 172-178
    const frontendPayload = {
      name: 'Vikram Singh',
      company: 'Bharat Heavy Engineering Works',
      email: 'vikram.singh@bhew.example.com',
      phone: '+91 8449368000',
      state: 'Uttar Pradesh',
      city: 'Noida',
      service: 'Guaranteed Saving Program',
      message: '[Organization Location: Noida, Uttar Pradesh]\n\nRequirement for manufacturing cost reduction audit.',
    };

    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frontendPayload),
    });

    assert.strictEqual(res.status, 201, 'Should respond with HTTP 201 Created');
    const json = (await res.json()) as any;
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.id, 202);
    // Verify values passed to SQL parameterized query ($1 to $8)
    assert.strictEqual(capturedValues[0], 'Vikram Singh');
    assert.strictEqual(capturedValues[1], 'Bharat Heavy Engineering Works');
    assert.strictEqual(capturedValues[2], 'vikram.singh@bhew.example.com');
    assert.strictEqual(capturedValues[3], '+91 8449368000');
    assert.strictEqual(capturedValues[4], 'Uttar Pradesh');
    assert.strictEqual(capturedValues[5], 'Noida');
    assert.strictEqual(capturedValues[6], 'Guaranteed Saving Program');
    assert.ok(capturedValues[7].includes('[Organization Location: Noida, Uttar Pradesh]'));
  });

  test('Scenario 10: Spam honeypot trap rejects automated bot submissions', async () => {
    const spamPayload = {
      ...validPayload,
      _hp_website: 'https://spam-bot-marketing.example.com',
    };

    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spamPayload),
    });

    assert.strictEqual(res.status, 400, 'Spam submission must be rejected with HTTP 400');
    const json = (await res.json()) as any;
    assert.strictEqual(json.success, false);
    assert.ok(
      json.message.includes('Automated submission') || json.errors?.form?.includes('Spam'),
      'Response must indicate spam rejection'
    );
  });

  test('Scenario 11: Email templates format visitor details and corporate information properly', () => {
    const sampleRecord: any = {
      id: 303,
      name: 'Anjali Verma',
      company: 'Tata Motors Pantnagar Vendor Division',
      email: 'anjali.verma@tatavendor.example.com',
      phone: '+91 9568799107',
      state: 'Uttarakhand',
      city: 'Pantnagar',
      service: 'Workforce Management Solutions',
      message: 'Urgent requirement for 50 certified assembly line fitters.',
      created_at: new Date().toISOString(),
    };

    const html = generateInquiryEmailHtml(sampleRecord);
    const text = generateInquiryEmailText(sampleRecord);

    // Verify key fields in HTML
    assert.ok(html.includes('Anjali Verma'));
    assert.ok(html.includes('Tata Motors Pantnagar Vendor Division'));
    assert.ok(html.includes('anjali.verma@tatavendor.example.com'));
    assert.ok(html.includes('+91 9568799107'));
    assert.ok(html.includes('Pantnagar, Uttarakhand'));
    assert.ok(html.includes('Workforce Management Solutions'));
    assert.ok(html.includes('Urgent requirement for 50 certified assembly line fitters.'));
    assert.ok(html.includes('INFOSPAN.UKD@gmail.com'));

    // Verify key fields in Plain Text
    assert.ok(text.includes('Anjali Verma'));
    assert.ok(text.includes('Tata Motors Pantnagar Vendor Division'));
    assert.ok(text.includes('anjali.verma@tatavendor.example.com'));
    assert.ok(text.includes('+91 9568799107'));
    assert.ok(text.includes('Pantnagar, Uttarakhand'));
    assert.ok(text.includes('Urgent requirement for 50 certified assembly line fitters.'));
  });

  test('Scenario 12: Email delivery failure or missing API key is handled gracefully without losing inquiry', async () => {
    const sampleRecord: any = {
      id: 404,
      name: 'Rohan Mehra',
      company: 'Kumaon Precision Tools',
      email: 'rohan.mehra@kumaontools.example.com',
      phone: '+91 9045085537',
      service: 'Experts Training for Industries',
      message: 'Need specialized Six Sigma training for 15 quality engineers.',
      created_at: new Date().toISOString(),
    };

    // When RESEND_API_KEY is not set
    const originalKey = config.resendApiKey;
    config.resendApiKey = '';

    const result = await sendInquiryNotificationEmail(sampleRecord);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.skipped, true);
    assert.ok(result.error?.includes('RESEND_API_KEY'));

    config.resendApiKey = originalKey;
  });

  test('Scenario 13: Simplified 5-field corporate inquiry submission succeeds with HTTP 201', async () => {
    const simplifiedPayload = {
      name: 'Sunil Kumar',
      company: 'Himalayan Precision Forgings',
      email: 'sunil.kumar@himalayanforge.example.com',
      phone: '+91 9045085537',
      service: 'Guaranteed Saving Program',
    };

    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simplifiedPayload),
    });

    assert.strictEqual(res.status, 201, 'Simplified submission must return HTTP 201 Created');
    const json = (await res.json()) as any;
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.name, 'Sunil Kumar');
    assert.strictEqual(json.data.company, 'Himalayan Precision Forgings');
    assert.strictEqual(json.data.email, 'sunil.kumar@himalayanforge.example.com');
    assert.strictEqual(json.data.service, 'Guaranteed Saving Program');
  });

  test('Scenario 14: Simplified 5-field email notification omits empty sections and escapes HTML', () => {
    const simplifiedRecord: any = {
      id: 505,
      name: '<script>alert("xss")</script>Vikram Singh',
      company: 'Pantnagar Auto Parts & Components',
      email: 'vikram.singh@pantnagarauto.example.com',
      phone: '+91 9045085537',
      service: 'Workforce Management Solutions',
      created_at: new Date().toISOString(),
    };

    const html = generateInquiryEmailHtml(simplifiedRecord);
    const text = generateInquiryEmailText(simplifiedRecord);

    // Verify no undefined, null or placeholder artifacts
    assert.strictEqual(html.includes('undefined'), false, 'HTML must not contain "undefined"');
    assert.strictEqual(html.includes('null'), false, 'HTML must not contain "null"');
    assert.strictEqual(text.includes('undefined'), false, 'Text must not contain "undefined"');
    assert.strictEqual(text.includes('null'), false, 'Text must not contain "null"');

    // Verify omitted optional sections do not produce empty blocks
    assert.strictEqual(html.includes('Location / Industrial Hub'), false, 'HTML must not show Location row');
    assert.strictEqual(html.includes('Requirement Details & Message:'), false, 'HTML must not show Requirement Details box');
    assert.strictEqual(text.includes('Location:'), false, 'Text must not show Location line');
    assert.strictEqual(text.includes('REQUIREMENT DETAILS'), false, 'Text must not show Requirement Details section');

    // Verify HTML escaping of special characters
    assert.strictEqual(html.includes('<script>'), false, 'HTML must escape <script> tag');
    assert.ok(html.includes('&lt;script&gt;'), 'HTML must contain escaped &lt;script&gt;');
    assert.ok(html.includes('Vikram Singh'), 'HTML must contain visitor name');
    assert.ok(html.includes('Pantnagar Auto Parts &amp; Components'), 'HTML must escape ampersand');

    // Verify Plain text formatting
    assert.ok(text.includes('Vikram Singh'));
    assert.ok(text.includes('Workforce Management Solutions'));
    assert.ok(text.includes('+91 9045085537'));
  });

  test('Scenario 9: Rate limiting threshold triggers HTTP 429 when max requests exceeded', async () => {
    // Send requests until the rate limit is reached
    let rateLimitedResponse: any = null;
    let rateLimitedJson: any = null;

    for (let i = 0; i < 25; i++) {
      const res = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      if (res.status === 429) {
        rateLimitedResponse = res;
        rateLimitedJson = (await res.json()) as any;
        break;
      }
    }

    assert.ok(rateLimitedResponse, 'Expected to hit HTTP 429 within rate limit threshold');
    assert.strictEqual(rateLimitedResponse.status, 429, 'Rate limited response must have status 429');
    assert.strictEqual(rateLimitedJson.success, false, 'Rate limited response must have success=false');
    assert.ok(
      rateLimitedJson.message.includes('Too many inquiries submitted'),
      'Rate limited response must contain expected rate limit error message'
    );
  });
});
