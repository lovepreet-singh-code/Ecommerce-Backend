import { createConsumer, OrderCreatedEvent, logger } from '@ecommerce-backend/common';
import { initializeProducer, disconnectProducer } from './producer';
import { handleOrderCreated } from '../consumers/order-created.consumer';

let consumer: Awaited<ReturnType<typeof createConsumer>> | null = null;

/**
 * Initialize Kafka consumer and producer
 */
export const initializeKafka = async () => {
    // Initialize producer
    await initializeProducer();

    // Initialize consumer
    const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
    const clientId = process.env.KAFKA_CLIENT_ID || 'inventory-service';
    const groupId = process.env.KAFKA_GROUP_ID || 'inventory-service-group';

    consumer = await createConsumer(brokers, clientId, groupId);
    logger.info('✅ Kafka Consumer initialized for inventory-service');

    // Subscribe to order.created events
    await consumer.subscribe('order.created', async (message: OrderCreatedEvent) => {
        await handleOrderCreated(message);
    });

    logger.info('✅ Subscribed to order.created topic');
};

/**
 * Shutdown Kafka connections
 */
export const shutdownKafka = async () => {
    if (consumer) {
        await consumer.disconnect();
        logger.info('🔌 Kafka Consumer disconnected');
    }

    await disconnectProducer();
};
