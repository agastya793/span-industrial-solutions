import { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { getRequestContext } from '../config/context.js';
import { isWorkerRuntime } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Resolves client IP address strictly from trusted RequestContext if available
 * (set from Cloudflare's CF-Connecting-IP header at the Worker edge),
 * or falls back to standard req.ip in local Node.js development.
 * Never trusts unverified client-supplied headers.
 */
export function getClientIp(req: Request): string {
  const ctx = getRequestContext();
  if (ctx?.clientIp) {
    return ctx.clientIp;
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Edge burst limiter for inquiry submissions using Cloudflare Workers Rate Limiting binding.
 *
 * Cloudflare Worker Rate Limiting Architecture:
 * - The native Cloudflare limiter binding (`INQUIRY_RATE_LIMITER`) runs at the Cloudflare edge,
 *   enforced per Cloudflare point of presence (PoP) with eventual consistency.
 *   It provides a fast edge burst guard (10 requests per 60s per client IP).
 * - Keyed by client IP from Cloudflare's CF-Connecting-IP header, or safe fallback if missing.
 * - Fails open on unexpected binding errors to avoid blocking legitimate users.
 */
export async function cloudflareInquiryRateLimiter(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ctx = getRequestContext();

  if (ctx?.inquiryRateLimiter) {
    // Key by client IP from Cloudflare's CF-Connecting-IP header, or safe fallback if missing
    const key = ctx.clientIp || 'unknown';

    try {
      const { success } = await ctx.inquiryRateLimiter.limit({ key });

      if (!success) {
        logger.warn(`Inquiry submission rate limit exceeded for IP: ${ctx.clientIp || '[missing-ip]'}`);
        res.status(429).json({
          success: false,
          message:
            'Too many inquiries submitted from this connection. Please try again after 15 minutes or reach us directly at INFOSPAN.UKD@gmail.com.',
        });
        return;
      }
    } catch (err: any) {
      // In case of an unexpected binding failure, log warning and fail open so legitimate users are not blocked
      logger.warn(`Cloudflare rate limiter check error: ${err.message}`);
    }
  }

  next();
}

/**
 * Factory for Node.js in-memory inquiry rate limiter.
 * In Cloudflare Workers, this is never invoked to prevent instantiating
 * express-rate-limit's timer-based MemoryStore (which calls setInterval in global scope).
 */
export function createNodeInquiryRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 inquiries per 15 min window
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    message: {
      success: false,
      message:
        'Too many inquiries submitted from this connection. Please try again after 15 minutes or reach us directly at INFOSPAN.UKD@gmail.com.',
    },
  });
}

/**
 * Factory for Node.js in-memory general API rate limiter.
 */
export function createNodeApiRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
  });
}

/**
 * Inquiry rate limiter middleware.
 * In Cloudflare Workers, safe pass-through (native INQUIRY_RATE_LIMITER binding handles rate limiting).
 * In Node.js development, created at app initialization.
 */
export const inquiryRateLimiter: RequestHandler = !isWorkerRuntime()
  ? createNodeInquiryRateLimiter()
  : (_req, _res, next) => next();

/**
 * API rate limiter middleware.
 * In Cloudflare Workers, safe pass-through.
 * In Node.js development, created at app initialization.
 */
export const apiRateLimiter: RequestHandler = !isWorkerRuntime()
  ? createNodeApiRateLimiter()
  : (_req, _res, next) => next();
