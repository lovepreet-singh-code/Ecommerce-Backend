/**
 * Example: Kafka Producer Usage in Product Service
 * 
 * This file demonstrates how to use the Kafka producer to publish product.updated events
 */

import { createProducer, createEvent, ProductUpdatedPayload } from '@ecommerce-backend/common';
import { logger } from '@ecommerce-backend/common';

let producer: Awaited<ReturnType<typeof createProducer>> | null = null;

/**
 * Initialize Kafka producer
 * Call this during service startup
 */
export async function initializeKafkaProducer() {
    try {
        const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
        const clientId = process.env.KAFKA_CLIENT_ID || 'product-service';

        producer = await createProducer(brokers, clientId);
        logger.info('✅ Kafka Producer initialized for product-service');
    } catch (error) {
        logger.error('❌ Failed to initialize Kafka Producer:', error);
        throw error;
    }
}

/**
 * Publish a product.updated event to Kafka
 * 
 * @param productId - The product ID that was updated
 * @param changes - Array of field changes
 * @param updatedBy - User/admin who made the update
 */
export async function publishProductUpdated(
    productId: string,
    changes: Array<{ field: string; oldValue: any; newValue: any }>,
    updatedBy: string
): Promise<void> {
    if (!producer) {
        throw new Error('Kafka producer not initialized. Call initializeKafkaProducer() first.');
    }

    try {
        // Create type-safe event envelope
        const event = createEvent<ProductUpdatedPayload>(
            'product.updated',
            {
                productId,
                changes,
                updatedBy,
                updatedAt: new Date().toISOString(),
            }
        );

        // Send to Kafka with automatic retry
        await producer.send('product.updated', [
            {
                key: productId, // Use productId as key for partitioning
                value: JSON.stringify(event),
            }
        ]);

        logger.info(`📤 Published product.updated event for product ${productId}`);
    } catch (error) {
        logger.error(`❌ Failed to publish product.updated event for product ${productId}:`, error);
        throw error;
    }
}

/**
 * Example: Publishing product update event after price change
 */
export async function examplePriceUpdate() {
    const productId = 'prod_123';
    const oldPrice = 999.99;
    const newPrice = 899.99;

    await publishProductUpdated(
        productId,
        [
            { field: 'price', oldValue: oldPrice, newValue: newPrice }
        ],
        'admin_001'
    );
}

/**
 * Example: Publishing product update event after stock change
 */
export async function exampleStockUpdate() {
    const productId = 'prod_456';
    const oldStock = 100;
    const newStock = 95;

    await publishProductUpdated(
        productId,
        [
            { field: 'stock', oldValue: oldStock, newValue: newStock }
        ],
        'inventory-service'
    );
}

/**
 * Example: Publishing multiple field updates
 */
export async function exampleMultipleFieldUpdate() {
    const productId = 'prod_789';

    await publishProductUpdated(
        productId,
        [
            { field: 'price', oldValue: 1499.99, newValue: 1299.99 },
            { field: 'stock', oldValue: 50, newValue: 48 },
            { field: 'category', oldValue: 'Electronics', newValue: 'Home Appliances' }
        ],
        'admin_002'
    );
}

/**
 * Cleanup on service shutdown
 */
export async function shutdownKafkaProducer() {
    if (producer) {
        await producer.disconnect();
        logger.info('🔌 Kafka Producer disconnected');
    }
}

// Usage in your product controller:
//
// import { publishProductUpdated } from './examples/kafka-example';
//
// async function updateProduct(req, res) {
//     const { id } = req.params;
//     const updates = req.body;
//
//     const oldProduct = await Product.findById(id);
//     const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
//
//     // Calculate changes
//     const changes = Object.keys(updates).map(field => ({
//         field,
//         oldValue: oldProduct[field],
//         newValue: updatedProduct[field]
//     }));
//
//     // Publish event
//     await publishProductUpdated(id, changes, req.user.id);
//
//     res.json(updatedProduct);
// }
