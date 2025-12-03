import mongoose from 'mongoose';
import { app } from './app';
import { logger } from '@ecommerce-backend/common';
import dotenv from 'dotenv';

dotenv.config();

const start = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI must be defined');
    }

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Connected to MongoDB');

        // Start Server
        const port = process.env.PORT || 3003;
        app.listen(port, () => {
            logger.info(`Review Service listening on port ${port}`);
        });
    } catch (err) {
        logger.error('Failed to start service:', err);
        process.exit(1);
    }
};

start();
