import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { app } from './app';
import { connectRedis } from './cache/redisClient';

dotenv.config();

const start = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI must be defined');
    }
    if (!process.env.REDIS_URL) {
        throw new Error('REDIS_URL must be defined');
    }

    try {
        await connectRedis();
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const PORT = process.env.PORT || 4001;
        app.listen(PORT, () => {
            console.log(`✅ Product Service listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

start();
