import { createProducer, createEvent, InventoryReservedPayload, InventoryFailedPayload, logger } from '@ecommerce-backend/common';

let producer: Awaited<ReturnType<typeof createProducer>> | null = null;

/**
 * Initialize Kafka producer
 */
export const initializeProducer = async () => {
    const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
    const clientId = process.env.KAFKA_CLIENT_ID || 'inventory-service';

    producer = await createProducer(brokers, clientId);
    logger.info('✅ Kafka Producer initialized for inventory-service');
};

/**
 * Publish inventory.reserved event
 */
export const publishInventoryReserved = async (
    orderId: string,
    reservationId: string,
    items: Array<{ productId: string; quantity: number }>,
    correlationId?: string
): Promise<void> => {
    if (!producer) {
        throw new Error('Kafka producer not initialized');
    }

    const event = createEvent<InventoryReservedPayload>(
        'inventory.reserved',
        {
            orderId,
            reservationId,
            items,
            reservedAt: new Date().toISOString()
        },
        correlationId
    );

    await producer.send('inventory.reserved', [
        {
            key: orderId,
            value: JSON.stringify(event)
        }
    ]);

    logger.info(`📤 Published inventory.reserved event for order ${orderId}`);
};

/**
 * Publish inventory.failed event
 */
export const publishInventoryFailed = async (
    orderId: string,
    items: Array<{
        productId: string;
        requestedQuantity: number;
        availableQuantity: number;
    }>,
    reason: string,
    correlationId?: string
): Promise<void> => {
    if (!producer) {
        throw new Error('Kafka producer not initialized');
    }

    const event = createEvent<InventoryFailedPayload>(
        'inventory.failed',
        {
            orderId,
            items,
            reason,
            failedAt: new Date().toISOString()
        },
        correlationId
    );

    await producer.send('inventory.failed', [
        {
            key: orderId,
            value: JSON.stringify(event)
        }
    ]);

    logger.info(`📤 Published inventory.failed event for order ${orderId}: ${reason}`);
};

/**
 * Disconnect producer
 */
export const disconnectProducer = async (): Promise<void> => {
    if (producer) {
        await producer.disconnect();
        logger.info('🔌 Kafka Producer disconnected');
    }
};
