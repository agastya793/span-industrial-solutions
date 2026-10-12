import fs from 'fs';
import { Pool } from 'pg';
import { config } from './env.js';
import { logger } from '../utils/logger.js';
import type { InquiryInput, InquiryRecord } from '../types/inquiry.js';

let isPgConnected = false;
let memoryInquiries: InquiryRecord[] = [];
let nextId = 1;

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

export const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  ssl: getPoolSslConfig(),
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client:', err.message);
});

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
  // If connection was lost or not yet established, attempt to connect
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
  return isPgConnected;
}
