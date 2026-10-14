import { httpServerHandler } from 'cloudflare:node';
import { createApp } from './app.js';
import {
  RequestContext,
  RateLimiterBinding,
  D1Database,
  runWithRequestContext,
  registerRequestContext,
  unregisterRequestContext,
} from './config/context.js';

export interface WorkerEnv {
  span_industrial_d1?: D1Database;
  HYPERDRIVE?: {
    connectionString: string;
  };
  INQUIRY_RATE_LIMITER?: RateLimiterBinding;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_TO_EMAIL?: string;
  NODE_ENV?: string;
  CORS_ORIGIN?: string;
  DATABASE_URL?: string;
}

export const app = createApp({ isWorker: true });

// Start Express listening on internal port for Cloudflare Node bridge
app.listen(8080);

const handler = httpServerHandler({ port: 8080 });

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: any): Promise<Response> {
    const requestId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);

    // Obtain trusted client IP from Cloudflare's CF-Connecting-IP header (not forgeable from outer client)
    const clientIp = request.headers.get('cf-connecting-ip')?.trim() || undefined;

    const context: RequestContext = {
      requestId,
      d1Database: env?.span_industrial_d1,
      hyperdriveConnectionString: env?.HYPERDRIVE?.connectionString,
      nodeEnv: env?.NODE_ENV || 'production',
      corsOrigin: env?.CORS_ORIGIN,
      resendApiKey: env?.RESEND_API_KEY ? env.RESEND_API_KEY.trim() : '',
      resendFromEmail: env?.RESEND_FROM_EMAIL?.trim() || 'notifications@spanindustrialsolutions.com',
      resendToEmail: env?.RESEND_TO_EMAIL?.trim()?.toLowerCase() || 'infospan.ukd@gmail.com',
      databaseUrl: env?.DATABASE_URL?.trim(),
      clientIp,
      inquiryRateLimiter: env?.INQUIRY_RATE_LIMITER,
    };

    registerRequestContext(requestId, context);

    // Forward the requestId to Express so the request context middleware binds it for Express
    const headers = new Headers(request.headers);
    headers.set('x-worker-request-id', requestId);
    const bridgeRequest = new Request(request, { headers });

    try {
      return await runWithRequestContext(context, async () => {
        if (typeof (handler as any).fetch === 'function') {
          return await (handler as any).fetch(bridgeRequest, env, ctx);
        }
        return await (handler as any)(bridgeRequest, env, ctx);
      });
    } finally {
      unregisterRequestContext(requestId);
    }
  },
};
