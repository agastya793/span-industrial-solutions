import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory or project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
if (typeof __dirname !== 'undefined') {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const isProduction = process.env.NODE_ENV === 'production';
const rawDatabaseUrl = process.env.DATABASE_URL?.trim();

// Enforce mandatory DATABASE_URL in production mode without falling back to localhost
if (isProduction && !rawDatabaseUrl) {
  throw new Error(
    'Configuration Error: DATABASE_URL environment variable is required in production mode. ' +
    'Please configure a valid PostgreSQL connection string.'
  );
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || (isProduction ? '' : 'http://localhost:5173'),
  databaseUrl: rawDatabaseUrl || 'postgresql://postgres:postgres@localhost:5432/spandb',
  databaseSsl: process.env.DATABASE_SSL,
  databaseSslCa: process.env.DATABASE_SSL_CA,
  databaseSslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
  resendApiKey: process.env.RESEND_API_KEY?.trim() || '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev',
  resendToEmail: (process.env.RESEND_TO_EMAIL?.trim() || 'infospan.ukd@gmail.com').toLowerCase(),
};
