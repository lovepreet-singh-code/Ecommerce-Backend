import { ProcessedOrder } from '../models/processed-order.schema';
import { logger } from '@ecommerce-backend/common';

export interface ProcessedOrderResult {
    orderId: string;
    status: 'reserved' | 'failed';
    reservationId?: string;
    items: Array<{ productId: string; quantity: number }>;
    reason?: string;
}

/**
 * Check if an order has already been processed
 */
export const isProcessed = async (orderId: string): Promise<boolean> => {
    const existing = await ProcessedOrder.findOne({ orderId });
    return !!existing;
};

/**
 * Get processed order details
 */
export const getProcessedOrder = async (orderId: string): Promise<ProcessedOrderResult | null> => {
    const order = await ProcessedOrder.findOne({ orderId });
    if (!order) return null;

    return {
        orderId: order.orderId,
        status: order.status,
        reservationId: order.reservationId,
        items: order.items,
        reason: order.reason
    };
};

/**
 * Mark order as processed
 */
export const markProcessed = async (
    orderId: string,
    status: 'reserved' | 'failed',
    items: Array<{ productId: string; quantity: number }>,
    reservationId?: string,
    reason?: string
): Promise<void> => {
    await ProcessedOrder.create({
        orderId,
        status,
        reservationId,
        items,
        reason,
        processedAt: new Date()
    });

    logger.info(`Marked order ${orderId} as processed with status: ${status}`);
};
