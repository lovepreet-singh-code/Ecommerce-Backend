import mongoose from 'mongoose';
import { app } from './app';
import { createProducer, createConsumer, logger } from '@ecommerce-backend/common';
import { kafkaWrapper } from './kafka-wrapper';
import { inventoryReservedConsumer } from './events/consumers/inventory-reserved-consumer';
import { inventoryFailedConsumer } from './events/consumers/inventory-failed-consumer';
import { paymentSuccessConsumer } from './events/consumers/payment-success-consumer';
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
        const producer = await createProducer(brokers, 'order-service-producer');
        kafkaWrapper.producer = producer;

        // Connect to Kafka Consumer
        const consumer = await createConsumer(brokers, 'order-service-consumer', 'order-service-group');
        await consumer.subscribe('inventory.reserved', inventoryReservedConsumer);
        await consumer.subscribe('inventory.failed', inventoryFailedConsumer);
        await consumer.subscribe('payment.success', paymentSuccessConsumer);

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Connected to MongoDB');

        // Start Server
        app.listen(3000, () => {
            logger.info('Listening on port 3000');
        });
    } catch (err) {
        logger.error('Failed to start service:', err);
        process.exit(1);
    }
};

start();
