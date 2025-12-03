import { OrderCreatedEvent, logger } from '@ecommerce-backend/common';
import * as inventoryService from '../services/inventory.service';
import * as idempotencyService from '../services/idempotency.service';
import * as kafkaProducer from '../kafka/producer';

/**
 * Handle order.created event
 * Implements idempotency and atomic reservation
 */
export const handleOrderCreated = async (event: OrderCreatedEvent): Promise<void> => {
    const { orderId, items } = event.data;
    const { correlationId } = event;

    logger.info(`📥 Received order.created event for order ${orderId}, correlationId: ${correlationId}`);

    try {
        // Step 1: Check idempotency
        const alreadyProcessed = await idempotencyService.isProcessed(orderId);

        if (alreadyProcessed) {
            const result = await idempotencyService.getProcessedOrder(orderId);
            logger.info(`Order ${orderId} already processed with status: ${result?.status}. Skipping (idempotent).`);
            return;
        }

        // Step 2: Prepare items for reservation
        const reservationItems = items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }));

        // Step 3: Attempt atomic reservation
        const result = await inventoryService.checkAndReserve(orderId, reservationItems);

        if (result.success) {
            // Success: Publish inventory.reserved event
            await kafkaProducer.publishInventoryReserved(
                orderId,
                result.reservationId!,
                reservationItems,
                correlationId
            );

            // Mark as processed
            await idempotencyService.markProcessed(
                orderId,
                'reserved',
                reservationItems,
                result.reservationId
            );

            logger.info(`✅ Successfully reserved inventory for order ${orderId}`);
        } else {
            // Failure: Publish inventory.failed event
            await kafkaProducer.publishInventoryFailed(
                orderId,
                result.failedItems!,
                result.reason!,
                correlationId
            );

            // Mark as processed (failed)
            await idempotencyService.markProcessed(
                orderId,
                'failed',
                reservationItems,
                undefined,
                result.reason
            );

            logger.warn(`⚠️  Failed to reserve inventory for order ${orderId}: ${result.reason}`);
        }

    } catch (error) {
        logger.error(`❌ Error processing order.created event for order ${orderId}:`, error);
        throw error;
    }
};
