import { config } from './config/env.js';
import { app } from './app.js';
import { initDatabase, pool } from './config/db.js';
import { logger } from './utils/logger.js';

// Start server and initialize database
async function startServer() {
  if (config.nodeEnv === 'production' && !config.databaseUrl) {
    throw new Error(
      'Configuration Error: DATABASE_URL environment variable is required in production mode. ' +
      'Please configure a valid PostgreSQL connection string.'
    );
  }

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
