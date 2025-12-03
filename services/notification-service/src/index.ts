import mongoose from 'mongoose';
import { app } from './app';
import { createConsumer, logger } from '@ecommerce-backend/common';
import { orderCreatedConsumer } from './events/consumers/order-created-consumer';
import { paymentSuccessConsumer } from './events/consumers/payment-success-consumer';
import { paymentFailedConsumer } from './events/consumers/payment-failed-consumer';
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

        // Connect to Kafka Consumer
        const consumer = await createConsumer(brokers, 'notification-service-consumer', 'notification-service-group');
        await consumer.subscribe('order.created', orderCreatedConsumer);
        await consumer.subscribe('payment.success', paymentSuccessConsumer);
        await consumer.subscribe('payment.failed', paymentFailedConsumer);

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Connected to MongoDB');

        // Start Server
        const port = process.env.PORT || 3002;
        app.listen(port, () => {
            logger.info(`Notification Service listening on port ${port}`);
        });
    } catch (err) {
        logger.error('Failed to start service:', err);
        process.exit(1);
    }
};

start();
