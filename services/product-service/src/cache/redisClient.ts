import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient>;

export const connectRedis = async () => {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({ url });

    redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));

    await redisClient.connect();
    console.log('✅ Connected to Redis');
};

export const getCache = async (key: string): Promise<string | null> => {
    if (!redisClient) return null;
    try {
        return await redisClient.get(key);
    } catch (error) {
        console.error(`Error getting cache for key ${key}:`, error);
        return null;
    }
};

export const setCache = async (key: string, value: string, ttl: number = 3600): Promise<void> => {
    if (!redisClient) return;
    try {
        await redisClient.set(key, value, { EX: ttl });
    } catch (error) {
        console.error(`Error setting cache for key ${key}:`, error);
    }
};

export const delCache = async (pattern: string): Promise<void> => {
    if (!redisClient) return;
    try {
        // Use scanIterator to find keys matching the pattern
        for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
            await redisClient.del(key);
        }
    } catch (error) {
        console.error(`Error deleting cache for pattern ${pattern}:`, error);
    }
};
