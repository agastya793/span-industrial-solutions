import { Router } from 'express';
import { createInquiry } from '../controllers/inquiryController.js';
import { inquiryRateLimiter, cloudflareInquiryRateLimiter } from '../middleware/rateLimiter.js';
import { isWorkerRuntime } from '../config/env.js';

export interface InquiryRouterOptions {
  isWorker?: boolean;
}

export function createInquiryRouter(options?: InquiryRouterOptions): Router {
  const isWorker = options?.isWorker ?? isWorkerRuntime();
  const router = Router();

  if (isWorker) {
    // Cloudflare Workers: native Rate Limiting binding only, zero timer-based stores
    router.post('/', cloudflareInquiryRateLimiter, createInquiry);
  } else {
    // Local Node.js: Cloudflare limiter (for testing context bindings) + Node in-memory rate limiter
    router.post('/', cloudflareInquiryRateLimiter, inquiryRateLimiter, createInquiry);
  }

  return router;
}

const inquiryRoutes = createInquiryRouter();
export default inquiryRoutes;
