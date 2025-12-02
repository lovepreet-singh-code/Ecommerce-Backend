/**
 * Example: Kafka Producer & Consumer Usage in Order Service
 * 
 * This file demonstrates:
 * 1. Producer: Publishing order.created events
 * 2. Consumer: Listening to payment.success and payment.failed events
 */

import {
    createProducer,
    createConsumer,
    createEvent,
    OrderCreatedPayload,
    PaymentSuccessEvent,
    PaymentFailedEvent,
    logger
} from '@ecommerce-backend/common';

let producer: Awaited<ReturnType<typeof createProducer>> | null = null;
let consumer: Awaited<ReturnType<typeof createConsumer>> | null = null;

// ==================== PRODUCER EXAMPLES ====================

/**
 * Initialize Kafka producer
 * Call this during service startup
 */
export async function initializeKafkaProducer() {
    try {
        const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
        const clientId = process.env.KAFKA_CLIENT_ID || 'order-service';

        producer = await createProducer(brokers, clientId);
        logger.info('✅ Kafka Producer initialized for order-service');
    } catch (error) {
        logger.error('❌ Failed to initialize Kafka Producer:', error);
        throw error;
    }
}

/**
 * Publish an order.created event to Kafka
 * 
 * @param orderId - The order ID
 * @param userId - The user who created the order
 * @param items - Array of ordered items
 * @param totalAmount - Total order amount
 * @param correlationId - Optional correlation ID for tracking the entire flow
 */
export async function publishOrderCreated(
    orderId: string,
    userId: string,
    items: Array<{ productId: string; quantity: number; price: number }>,
    totalAmount: number,
    correlationId?: string
): Promise<void> {
    if (!producer) {
        throw new Error('Kafka producer not initialized. Call initializeKafkaProducer() first.');
    }

    try {
        // Create type-safe event envelope with correlation ID
        const event = createEvent<OrderCreatedPayload>(
            'order.created',
            {
                orderId,
                userId,
                items,
                totalAmount,
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
            correlationId // Pass through for end-to-end tracing
        );

        // Send to Kafka with automatic retry
        await producer.send('order.created', [
            {
                key: orderId, // Use orderId as key for partitioning
                value: JSON.stringify(event),
            }
        ]);

        logger.info(`📤 Published order.created event for order ${orderId} with correlationId ${event.correlationId}`);
    } catch (error) {
        logger.error(`❌ Failed to publish order.created event for order ${orderId}:`, error);
        throw error;
    }
}

/**
 * Example: Publishing order creation
 */
export async function exampleCreateOrder() {
    const orderId = 'ord_12345';
    const userId = 'usr_789';
    const correlationId = `checkout-flow-${Date.now()}`;

    await publishOrderCreated(
        orderId,
        userId,
        [
            { productId: 'prod_001', quantity: 2, price: 999.99 },
            { productId: 'prod_002', quantity: 1, price: 499.99 }
        ],
        2499.97,
        correlationId
    );
}

// ==================== CONSUMER EXAMPLES ====================

/**
 * Initialize Kafka consumer and subscribe to payment events
 * Call this during service startup
 */
export async function initializeKafkaConsumer() {
    try {
        const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
        const clientId = process.env.KAFKA_CLIENT_ID || 'order-service';
        const groupId = process.env.KAFKA_GROUP_ID || 'order-service-group';

        consumer = await createConsumer(brokers, clientId, groupId);
        logger.info('✅ Kafka Consumer initialized for order-service');

        // Subscribe to payment.success events
        await consumer.subscribe('payment.success', handlePaymentSuccess);

        // Subscribe to payment.failed events
        // Note: You'll need a separate consumer instance for multiple topics
        // or use the consumer's built-in support for multiple topics

    } catch (error) {
        logger.error('❌ Failed to initialize Kafka Consumer:', error);
        throw error;
    }
}

/**
 * Handle payment.success event
 * Updates order status to 'paid' and triggers fulfillment
 */
async function handlePaymentSuccess(message: PaymentSuccessEvent): Promise<void> {
    const { orderId, paymentId, amount, transactionId } = message.data;
    const { correlationId } = message;

    logger.info(`💳 Processing payment success for order ${orderId}, correlationId: ${correlationId}`);

    try {
        // Update order status in database
        await updateOrderStatus(orderId, 'paid', {
            paymentId,
            transactionId,
            paidAmount: amount,
            paidAt: message.data.paidAt
        });

        logger.info(`✅ Order ${orderId} marked as paid. Transaction: ${transactionId}`);

        // Trigger next steps (e.g., send to fulfillment)
        // await triggerFulfillment(orderId);

    } catch (error) {
        logger.error(`❌ Failed to process payment success for order ${orderId}:`, error);
        // Could send to dead letter queue or retry queue here
        throw error;
    }
}

/**
 * Handle payment.failed event
 * Updates order status to 'payment_failed' and notifies user
 */
async function handlePaymentFailed(message: PaymentFailedEvent): Promise<void> {
    const { orderId, reason, errorCode } = message.data;
    const { correlationId } = message;

    logger.warn(`⚠️  Processing payment failure for order ${orderId}, correlationId: ${correlationId}`);

    try {
        // Update order status in database
        await updateOrderStatus(orderId, 'payment_failed', {
            failureReason: reason,
            errorCode,
            failedAt: message.data.failedAt
        });

        logger.info(`✅ Order ${orderId} marked as payment_failed. Reason: ${reason}`);

        // Optionally: Release inventory reservation
        // await releaseInventoryReservation(orderId);

        // Optionally: Notify user about payment failure
        // await notifyUserPaymentFailed(orderId, reason);

    } catch (error) {
        logger.error(`❌ Failed to process payment failure for order ${orderId}:`, error);
        throw error;
    }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Mock function to update order status
 * Replace with actual database update logic
 */
async function updateOrderStatus(
    orderId: string,
    status: string,
    metadata?: Record<string, any>
): Promise<void> {
    // Example: await Order.findByIdAndUpdate(orderId, { status, ...metadata });
    logger.info(`Updated order ${orderId} status to ${status}`, metadata);
}

// ==================== CLEANUP ====================

/**
 * Cleanup on service shutdown
 */
export async function shutdownKafka() {
    if (producer) {
        await producer.disconnect();
        logger.info('🔌 Kafka Producer disconnected');
    }
    if (consumer) {
        await consumer.disconnect();
        logger.info('🔌 Kafka Consumer disconnected');
    }
}

// ==================== USAGE EXAMPLE ====================

// In your order controller:
//
// import { publishOrderCreated } from './examples/kafka-example';
//
// async function createOrder(req, res) {
//     const { userId, items } = req.body;
//     const correlationId = `checkout-${req.headers['x-request-id'] || Date.now()}`;
//
//     // Calculate total
//     const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//
//     // Create order in database
//     const order = await Order.create({
//         userId,
//         items,
//         totalAmount,
//         status: 'pending'
//     });
//
//     // Publish event for other services
//     await publishOrderCreated(
//         order.id,
//         userId,
//         items,
//         totalAmount,
//         correlationId
//     );
//
//     res.status(201).json({ order, correlationId });
// }

// In your main app initialization (e.g., index.ts):
//
// import { initializeKafkaProducer, initializeKafkaConsumer, shutdownKafka } from './examples/kafka-example';
//
// async function main() {
//     // Initialize Kafka
//     await initializeKafkaProducer();
//     await initializeKafkaConsumer();
//
//     // Start your Express app
//     app.listen(PORT, () => {
//         console.log(`Order service listening on port ${PORT}`);
//     });
//
//     // Graceful shutdown
//     process.on('SIGTERM', async () => {
//         await shutdownKafka();
//         process.exit(0);
//     });
// }
