import { Request, Response } from 'express';
import { validateInquiry } from '../validators/inquiryValidator.js';
import { processInquiry } from '../services/inquiryService.js';
import { isDatabaseConnected, checkDatabaseHealth } from '../config/db.js';
import { config } from '../config/env.js';
import type { ApiResponse, InquiryRecord } from '../types/inquiry.js';
import { logger } from '../utils/logger.js';

export async function createInquiry(
  req: Request,
  res: Response<ApiResponse<InquiryRecord>>
): Promise<void> {
  try {
    const validation = validateInquiry(req.body);

    if (!validation.isValid || !validation.sanitizedData) {
      if (validation.errors._hp_website) {
        logger.warn('Automated inquiry submission blocked by honeypot filter.');
        res.status(400).json({
          success: false,
          message: 'Automated submission rejected. Please contact us directly if this is an error.',
          errors: { form: 'Spam submission detected.' },
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: 'Please resolve the highlighted errors before submitting.',
        errors: validation.errors,
      });
      return;
    }

    // In production, prevent acceptance if database is disconnected
    if (config.nodeEnv === 'production' && !isDatabaseConnected()) {
      logger.error('Inquiry submission rejected: database is offline in production.');
      res.status(503).json({
        success: false,
        message: 'Inquiry service is temporarily unavailable. Please try again in a few moments or email us directly at INFOSPAN.UKD@gmail.com.',
      });
      return;
    }

    const savedRecord = await processInquiry(validation.sanitizedData);

    res.status(201).json({
      success: true,
      message: 'Thank you. Your inquiry has been received. Our solutions team will contact you shortly.',
      data: savedRecord,
    });
  } catch (error: any) {
    logger.error('Error handling inquiry submission:', error.message);
    const statusCode = config.nodeEnv === 'production' ? 503 : 500;
    res.status(statusCode).json({
      success: false,
      message: config.nodeEnv === 'production'
        ? 'Inquiry service is temporarily unavailable. Please try again in a few moments or email us directly at INFOSPAN.UKD@gmail.com.'
        : 'Failed to process inquiry. Please try again or contact us directly at INFOSPAN.UKD@gmail.com.',
    });
  }
}

export async function getHealthStatus(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const isConnected = await checkDatabaseHealth();
    const isProd = config.nodeEnv === 'production';
    const statusCode = !isConnected && isProd ? 503 : 200;

    res.status(statusCode).json({
      status: isConnected ? 'healthy' : (isProd ? 'degraded' : 'healthy'),
      timestamp: new Date().toISOString(),
      database: isConnected ? 'connected' : (isProd ? 'disconnected' : 'memory_fallback'),
      company: 'SPAN Industrial Solutions Pvt Ltd',
    });
  } catch (err: any) {
    logger.error('Database health check probe failed unexpectedly:', err.message);
    const isProd = config.nodeEnv === 'production';
    res.status(isProd ? 503 : 200).json({
      status: isProd ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      database: isProd ? 'disconnected' : 'memory_fallback',
      company: 'SPAN Industrial Solutions Pvt Ltd',
    });
  }
}
