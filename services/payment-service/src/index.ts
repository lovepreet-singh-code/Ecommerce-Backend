import mongoose from 'mongoose';
import { app } from './app';
import { createProducer, logger } from '@ecommerce-backend/common';
import { kafkaWrapper } from './kafka-wrapper';
import dotenv from 'dotenv';

dotenv.config();

const start = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI must be defined');
    }
    if (!process.env.KAFKA_BROKERS) {
        throw new Error('KAFKA_BROKERS must be defined');
    }

    try {
        const brokers = process.env.KAFKA_BROKERS.split(',');

        // Connect to Kafka Producer
        const producer = await createProducer(brokers, 'payment-service-producer');
        kafkaWrapper.producer = producer;

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Connected to MongoDB');

        // Start Server
        const port = process.env.PORT || 3001;
        app.listen(port, () => {
            logger.info(`Payment Service listening on port ${port}`);
        });
    } catch (err) {
        logger.error('Failed to start service:', err);
        process.exit(1);
    }
};

start();
