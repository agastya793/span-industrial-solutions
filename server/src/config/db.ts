import fs from 'fs';
import { Pool, Client } from 'pg';
import { config, isWorkerRuntime } from './env.js';
import { logger } from '../utils/logger.js';
import type { InquiryInput, InquiryRecord } from '../types/inquiry.js';
import {
  getRequestContext,
  runWithRequestContext,
  D1Database,
} from './context.js';

let isPgConnected = false;
let memoryInquiries: InquiryRecord[] = [];
let nextId = 1;

/**
 * Runs a callback within a request-scoped D1 context.
 */
export function runWithD1<T>(d1: D1Database | undefined, fn: () => T): T {
  const currentContext = getRequestContext() || {};
  return runWithRequestContext({ ...currentContext, d1Database: d1 }, fn);
}

/**
 * Retrieves the D1 database binding strictly from the active request context.
 * Returns null if outside a request context or if no D1 binding was provided.
 * Never falls back to a mutable global variable.
 */
export function getD1Database(): D1Database | null {
  return getRequestContext()?.d1Database || null;
}

/**
 * Runs a callback within a request-scoped Hyperdrive context.
 */
export function runWithHyperdrive<T>(connStr: string | undefined, fn: () => T): T {
  const currentContext = getRequestContext() || {};
  return runWithRequestContext({ ...currentContext, hyperdriveConnectionString: connStr }, fn);
}

/**
 * Retrieves the Hyperdrive connection string strictly from the active request context.
 * Returns null if outside a request context or if no Hyperdrive binding was provided.
 * Never falls back to a mutable global variable.
 */
export function getHyperdriveConnectionString(): string | null {
  return getRequestContext()?.hyperdriveConnectionString || null;
}

export interface SslOptions {
  rejectUnauthorized: boolean;
  ca?: string;
}

/**
 * Resolves the CA certificate from a PEM string or a readable file path.
 * If a path is provided, it must exist and be readable; otherwise fails safely.
 */
export function resolveCaCertificate(caInput?: string): string | undefined {
  if (!caInput) return undefined;
  const trimmed = caInput.trim();
  if (!trimmed) return undefined;

  // Direct PEM certificate content
  if (trimmed.includes('-----BEGIN CERTIFICATE-----')) {
    return trimmed;
  }

  const looksLikeFilePath =
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    /^[a-zA-Z]:[\\/]/.test(trimmed) ||
    trimmed.endsWith('.pem') ||
    trimmed.endsWith('.crt') ||
    trimmed.endsWith('.cer');

  if (looksLikeFilePath) {
    if (!fs.existsSync(trimmed)) {
      throw new Error(
        'Configuration Error: The database CA certificate file specified in DATABASE_SSL_CA does not exist.'
      );
    }
    try {
      return fs.readFileSync(trimmed, 'utf8');
    } catch {
      throw new Error(
        'Configuration Error: Unable to read database CA certificate file at specified path. Please verify file permissions.'
      );
    }
  }

  if (fs.existsSync(trimmed)) {
    try {
      return fs.readFileSync(trimmed, 'utf8');
    } catch {
      throw new Error(
        'Configuration Error: Unable to read database CA certificate file at specified path. Please verify file permissions.'
      );
    }
  }

  return trimmed;
}

/**
 * Derives secure SSL/TLS connection options for PostgreSQL.
 *
 * In production (NODE_ENV === 'production'):
 * - TLS is ALWAYS enabled. Attempts to disable via DATABASE_SSL=false are ignored.
 * - Certificate verification is ALWAYS enforced (rejectUnauthorized: true).
 *   Attempts to disable via DATABASE_SSL_REJECT_UNAUTHORIZED=false are ignored.
 * - DATABASE_SSL_CA supports either a PEM string or a readable certificate file path.
 *
 * In development (NODE_ENV !== 'production'):
 * - TLS is disabled by default (ssl: false) so local PostgreSQL instances connect seamlessly.
 * - If DATABASE_SSL=true is explicitly set, certificate verification remains enabled by default.
 */
export function getPoolSslConfig(
  nodeEnv: string = config.nodeEnv,
  databaseSsl: string | undefined = config.databaseSsl,
  databaseSslRejectUnauthorized: string | undefined = config.databaseSslRejectUnauthorized,
  databaseSslCa: string | undefined = config.databaseSslCa
): boolean | SslOptions {
  const isProduction = nodeEnv === 'production';

  if (isProduction) {
    const resolvedCa = resolveCaCertificate(databaseSslCa);
    const sslConfig: SslOptions = {
      rejectUnauthorized: true,
    };

    if (resolvedCa) {
      sslConfig.ca = resolvedCa;
    }

    return sslConfig;
  }

  // Development: SSL disabled by default for local PostgreSQL
  if (databaseSsl === 'true') {
    const resolvedCa = resolveCaCertificate(databaseSslCa);
    const sslConfig: SslOptions = {
      rejectUnauthorized: databaseSslRejectUnauthorized !== 'false',
    };

    if (resolvedCa) {
      sslConfig.ca = resolvedCa;
    }

    return sslConfig;
  }

  return false;
}

/**
 * Global pool for local Node.js development and test environments.
 * In Cloudflare Workers, a proxy object is used so no idle timers or startup
 * connection pools are created in the serverless isolate.
 */
export const pool: Pool = isWorkerRuntime()
  ? (new Proxy({} as Pool, {
      get(_target, prop) {
        if (prop === 'on') return () => {};
        if (prop === 'end') return async () => {};
        if (prop === 'connect') return async () => ({ query: async () => {}, release: () => {} });
        if (prop === 'query') return async () => ({ rows: [] });
        return undefined;
      },
    }))
  : new Pool({
      connectionString: config.databaseUrl || undefined,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      ssl: getPoolSslConfig(),
    });

if (!isWorkerRuntime()) {
  pool.on('error', (err) => {
    logger.error('Unexpected error on idle PostgreSQL client:', err.message);
  });
}


export async function initDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    isPgConnected = true;
    logger.info('Successfully connected to PostgreSQL database.');

    const schemaQuery = `
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        company VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        state VARCHAR(100),
        city VARCHAR(100),
        service VARCHAR(100) NOT NULL,
        message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS state VARCHAR(100);
      ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE inquiries ALTER COLUMN message DROP NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
      CREATE INDEX IF NOT EXISTS idx_inquiries_service ON inquiries(service);
      CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
    `;

    await client.query(schemaQuery);
    client.release();
    logger.info('Database schema verified: `inquiries` table is ready.');
  } catch (err: any) {
    isPgConnected = false;
    if (config.nodeEnv === 'production') {
      logger.error(`PostgreSQL connection failed in production mode: ${err.message}`);
    } else {
      logger.warn(
        `PostgreSQL connection could not be established (${err.message}). ` +
        'Using local in-memory storage mode for inquiries (development mode only).'
      );
    }
  }
}

export async function insertInquiry(data: InquiryInput): Promise<InquiryRecord> {
  const d1 = getD1Database();
  const hyperdriveConn = getHyperdriveConnectionString();

  if (isWorkerRuntime()) {
    if (!d1) {
      logger.error('Inquiry rejected: No D1 database binding found in the active request context.');
      throw new Error('Database access failed: No D1 database binding available in the active request context.');
    }

    // Cloudflare Workers + D1 execution path (prepared statements with bound parameters)
    try {
      const query = `
        INSERT INTO inquiries (name, company, email, phone, state, city, service, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id, name, company, email, phone, state, city, service, message, created_at;
      `;
      const result = await d1
        .prepare(query)
        .bind(
          data.name,
          data.company,
          data.email,
          data.phone,
          data.state || null,
          data.city || null,
          data.service,
          data.message || null
        )
        .first<InquiryRecord>();

      if (!result) {
        throw new Error('D1 insert operation returned no record.');
      }
      return result;
    } catch (err: any) {
      logger.error('D1 insertion query failed:', err.message);
      if (config.nodeEnv === 'production') {
        throw new Error('Database persistence failed.');
      }
      throw err;
    }
  } else if (d1) {
    // D1 execution path explicitly active in test/context
    try {
      const query = `
        INSERT INTO inquiries (name, company, email, phone, state, city, service, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id, name, company, email, phone, state, city, service, message, created_at;
      `;
      const result = await d1
        .prepare(query)
        .bind(
          data.name,
          data.company,
          data.email,
          data.phone,
          data.state || null,
          data.city || null,
          data.service,
          data.message || null
        )
        .first<InquiryRecord>();

      if (!result) {
        throw new Error('D1 insert operation returned no record.');
      }
      return result;
    } catch (err: any) {
      logger.error('D1 insertion query failed:', err.message);
      if (config.nodeEnv === 'production') {
        throw new Error('Database persistence failed.');
      }
      throw err;
    }
  } else if (hyperdriveConn) {
    // Hyperdrive execution path explicitly active in test/context (DML only)
    const client = new Client({
      connectionString: hyperdriveConn,
    });

    try {
      await client.connect();
      const query = `
        INSERT INTO inquiries (name, company, email, phone, state, city, service, message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, company, email, phone, state, city, service, message, created_at;
      `;
      const values = [
        data.name,
        data.company,
        data.email,
        data.phone,
        data.state || null,
        data.city || null,
        data.service,
        data.message || null,
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (err: any) {
      logger.error('Hyperdrive insertion query failed:', err.message);
      if (config.nodeEnv === 'production') {
        throw new Error('Database persistence failed.');
      }
    } finally {
      await client.end().catch((err) => {
        logger.warn('Error closing Hyperdrive client:', err.message);
      });
    }
  } else {
    // Local Node.js development / test execution path
    if (!isPgConnected) {
      await initDatabase();
    }

    if (isPgConnected) {
      try {
        const query = `
          INSERT INTO inquiries (name, company, email, phone, state, city, service, message)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, name, company, email, phone, state, city, service, message, created_at;
        `;
        const values = [
          data.name,
          data.company,
          data.email,
          data.phone,
          data.state || null,
          data.city || null,
          data.service,
          data.message || null,
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
      } catch (err: any) {
        logger.error('Database insertion query failed:', err.message);
        if (config.nodeEnv === 'production') {
          throw new Error('Database persistence failed.');
        }
      }
    }
  }

  // In production, never silently fall back to ephemeral process memory
  if (config.nodeEnv === 'production') {
    logger.error('Inquiry rejected: database persistence unavailable in production.');
    throw new Error('Database is currently unavailable.');
  }

  // In-memory fallback (DEVELOPMENT MODE ONLY)
  logger.warn('Development mode: saving inquiry to ephemeral in-memory store.');
  const record: InquiryRecord = {
    id: nextId++,
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone,
    state: data.state,
    city: data.city,
    service: data.service,
    message: data.message,
    created_at: new Date().toISOString(),
  };
  memoryInquiries.push(record);
  return record;
}

export function isDatabaseConnected(): boolean {
  if (isWorkerRuntime()) {
    return Boolean(getD1Database());
  }
  if (getD1Database()) {
    return true;
  }
  return isPgConnected;
}

/**
 * Asynchronously checks database availability by executing a lightweight SELECT 1 probe.
 * In Cloudflare Workers, uses the active request's Hyperdrive connection from request context.
 * In local Node.js development, uses the local connection pool.
 * Safely releases or closes the client in all scenarios without leaking connections.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  const d1 = getD1Database();
  const hyperdriveConn = getHyperdriveConnectionString();

  if (isWorkerRuntime()) {
    if (!d1) {
      logger.warn('Database health check probe skipped: No D1 database binding in request context.');
      return false;
    }

    try {
      await d1.prepare('SELECT 1').first();
      return true;
    } catch (err: any) {
      logger.error('Database health check probe failed via D1:', err.message);
      return false;
    }
  } else if (d1) {
    // D1 context explicitly active (e.g. in test harness)
    try {
      await d1.prepare('SELECT 1').first();
      return true;
    } catch (err: any) {
      logger.error('Database health check probe failed via D1:', err.message);
      return false;
    }
  } else if (hyperdriveConn) {
    // Hyperdrive context active (e.g. in test harness)
    const client = new Client({
      connectionString: hyperdriveConn,
      connectionTimeoutMillis: 3000,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      return true;
    } catch (err: any) {
      logger.error('Database health check probe failed via Hyperdrive:', err.message);
      return false;
    } finally {
      await client.end().catch((endErr) => {
        logger.warn('Error closing health check Hyperdrive client:', endErr.message);
      });
    }
  } else {
    // Local Node.js development / test execution path via pool
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        isPgConnected = true;
        return true;
      } finally {
        client.release();
      }
    } catch (err: any) {
      isPgConnected = false;
      logger.warn('Database health check probe failed via pool:', err.message);
      return false;
    }
  }
}
