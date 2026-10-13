import { config } from './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initDatabase, pool } from './config/db.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible integration when running frontend separately
    crossOriginEmbedderPolicy: false,
  })
);

/**
 * Normalizes an origin candidate (e.g. "https://example.com/" -> "https://example.com").
 * Returns null if the URL is invalid or malformed.
 */
function normalizeOrigin(candidate: string): string | null {
  try {
    const parsed = new URL(candidate);
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Parses comma-separated allowed origins from configuration into a normalized array.
 * Safely ignores invalid entries without failing open.
 */
function parseAllowedOrigins(rawOrigins?: string): string[] {
  if (!rawOrigins) return [];
  return rawOrigins
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizeOrigin(item))
    .filter((item): item is string => item !== null);
}

/**
 * Validates whether an origin represents a legitimate local development environment.
 * Uses strict URL host and protocol inspection instead of broad substring matching.
 */
function isLocalDevelopmentOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const isHttpOrHttps = url.protocol === 'http:' || url.protocol === 'https:';
    return isLocalhost && isHttpOrHttps;
  } catch {
    return false;
  }
}

const allowedOrigins = parseAllowedOrigins(config.corsOrigin);
const isProduction = config.nodeEnv === 'production';

// Secure CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow non-browser requests without an Origin header (e.g. server-to-server, curl, health probes)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Parse and normalize incoming browser Origin header
      const normalizedOrigin = normalizeOrigin(origin);
      if (!normalizedOrigin) {
        // Reject malformed Origin headers
        return callback(null, false);
      }

      // 3. Allow explicitly configured origins
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // 4. In local development only, allow standard localhost / 127.0.0.1 origins
      if (!isProduction && isLocalDevelopmentOrigin(normalizedOrigin)) {
        return callback(null, true);
      }

      // 5. Fail safely: Reject all other unapproved origins
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Limit JSON body size to prevent memory exhaustion attacks
app.use(express.json({ limit: '100kb' }));

// General API rate limiter
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/health', healthRoutes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    company: 'SPAN Industrial Solutions Pvt Ltd',
    service: 'Backend API Service',
    status: 'online',
    version: '1.0.0',
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server and initialize database
async function startServer() {
  await initDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`SPAN API Server is running on port ${config.port} [${config.nodeEnv}]`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down SPAN API Server gracefully...');
    server.close(async () => {
      await pool.end();
      logger.info('Database connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
