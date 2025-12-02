import Redis from 'ioredis';
import { logger } from '@ecommerce-backend/common';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis> => {
    if (redisClient && redisClient.status === 'ready') {
        return redisClient;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        reconnectOnError: (err) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
                // Only reconnect when the error contains "READONLY"
                return true;
            }
            return false;
        }
    });

    redisClient.on('connect', () => {
        logger.info('✅ Redis client connected');
    });

    redisClient.on('ready', () => {
        logger.info('✅ Redis client ready');
    });

    redisClient.on('error', (err) => {
        logger.error('❌ Redis client error:', err);
    });

    redisClient.on('close', () => {
        logger.warn('⚠️  Redis client connection closed');
    });

    redisClient.on('reconnecting', () => {
        logger.info('🔄 Redis client reconnecting...');
    });

    // Wait for connection to be ready
    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Redis connection timeout'));
        }, 10000);

        redisClient!.once('ready', () => {
            clearTimeout(timeout);
            resolve();
        });

        redisClient!.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });

    return redisClient;
};

export const getRedisClient = (): Redis => {
    if (!redisClient || redisClient.status !== 'ready') {
        throw new Error('Redis client not initialized. Call connectRedis() first.');
    }
    return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger.info('🔌 Redis client disconnected');
    }
};
