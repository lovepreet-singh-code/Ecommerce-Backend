import * as dotenv from 'dotenv';
import { logger, loadEnv } from '@ecommerce-backend/common';
import { connectRedis, disconnectRedis } from './config/redis';
import { app } from './app';

dotenv.config();

// Main startup function
const startServer = async () => {
    try {
        // Validate environment variables
        loadEnv(['PORT', 'REDIS_URL', 'JWT_SECRET']);

        // Connect to Redis
        await connectRedis();

        // Start the server
        const PORT = process.env.PORT || 4002;

        app.listen(PORT, () => {
            logger.info(`✅ Cart Service listening on port ${PORT}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await disconnectRedis();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await disconnectRedis();
    process.exit(0);
});

// Start the server
startServer();
