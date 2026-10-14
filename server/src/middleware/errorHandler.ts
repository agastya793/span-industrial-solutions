import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import type { ApiResponse } from '../types/inquiry.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON payload received in request body.',
    });
    return;
  }

  logger.error('Unhandled server error:', err.stack || err.message);

  res.status(500).json({
    success: false,
    message: 'An unexpected internal error occurred. Please try again or reach out to INFOSPAN.UKD@gmail.com.',
  });
}
