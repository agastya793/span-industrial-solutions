import dotenv from 'dotenv';
import path from 'path';

import { getRequestContext } from './context.js';

export {
  RequestContext,
  getRequestContext,
  runWithRequestContext,
} from './context.js';

// Safely load .env in local Node.js environments (ignored in serverless/workers)
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
  if (typeof __dirname !== 'undefined') {
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  }
} catch {
  // Ignore missing filesystem in serverless/worker environments
}

export function isWorkerRuntime(): boolean {
  return (
    (typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers') ||
    typeof (globalThis as any).WebSocketPair !== 'undefined'
  );
}

// Local override variables used strictly for local Node.js test harnesses
let localNodeEnvOverride: string | undefined;
let localResendApiKeyOverride: string | undefined;

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  databaseUrl: string;
  databaseSsl: string | undefined;
  databaseSslCa: string | undefined;
  databaseSslRejectUnauthorized: string | undefined;
  resendApiKey: string;
  resendFromEmail: string;
  resendToEmail: string;
}

/**
 * Global application configuration.
 * When called within an active Worker request context, properties dynamically resolve
 * to that specific request's environment bindings, preventing cross-request pollution.
 * Outside a request context (e.g. Node.js startup or test harnesses), falls back to process.env.
 */
export const config: AppConfig = {
  get port(): number {
    return parseInt(process.env.PORT || '5000', 10);
  },
  get nodeEnv(): string {
    const ctx = getRequestContext();
    if (ctx?.nodeEnv) return ctx.nodeEnv;
    if (localNodeEnvOverride !== undefined) return localNodeEnvOverride;
    return process.env['NODE_ENV'] || (isWorkerRuntime() ? 'production' : 'development');
  },
  set nodeEnv(val: string) {
    if (!isWorkerRuntime()) {
      localNodeEnvOverride = val;
    }
  },
  get corsOrigin(): string {
    const ctx = getRequestContext();
    if (ctx?.corsOrigin !== undefined) return ctx.corsOrigin;
    const isProd = this.nodeEnv === 'production';
    return process.env.CORS_ORIGIN || (isProd ? '' : 'http://localhost:5173');
  },
  set corsOrigin(val: string) {
    if (!isWorkerRuntime()) {
      process.env.CORS_ORIGIN = val;
    }
  },
  get databaseUrl(): string {
    const rawUrl = process.env.DATABASE_URL?.trim();
    if (rawUrl) return rawUrl;
    return isWorkerRuntime() || this.nodeEnv === 'production'
      ? ''
      : 'postgresql://postgres:postgres@localhost:5432/spandb';
  },
  set databaseUrl(val: string) {
    if (!isWorkerRuntime()) {
      process.env.DATABASE_URL = val;
    }
  },
  get databaseSsl(): string | undefined {
    return process.env.DATABASE_SSL;
  },
  get databaseSslCa(): string | undefined {
    return process.env.DATABASE_SSL_CA;
  },
  get databaseSslRejectUnauthorized(): string | undefined {
    return process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
  },
  get resendApiKey(): string {
    const ctx = getRequestContext();
    if (ctx?.resendApiKey !== undefined) return ctx.resendApiKey;
    if (localResendApiKeyOverride !== undefined) return localResendApiKeyOverride;
    return process.env.RESEND_API_KEY?.trim() || '';
  },
  set resendApiKey(val: string) {
    if (!isWorkerRuntime()) {
      localResendApiKeyOverride = val;
    }
  },
  get resendFromEmail(): string {
    const ctx = getRequestContext();
    if (ctx?.resendFromEmail !== undefined) return ctx.resendFromEmail;
    return process.env.RESEND_FROM_EMAIL?.trim() || 'notifications@spanindustrialsolutions.com';
  },
  set resendFromEmail(val: string) {
    if (!isWorkerRuntime()) {
      process.env.RESEND_FROM_EMAIL = val;
    }
  },
  get resendToEmail(): string {
    const ctx = getRequestContext();
    if (ctx?.resendToEmail !== undefined) return ctx.resendToEmail;
    return (process.env.RESEND_TO_EMAIL?.trim() || 'infospan.ukd@gmail.com').toLowerCase();
  },
  set resendToEmail(val: string) {
    if (!isWorkerRuntime()) {
      process.env.RESEND_TO_EMAIL = val;
    }
  },
};
