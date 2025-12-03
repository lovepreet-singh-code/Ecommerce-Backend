import mongoose from 'mongoose';
import { Stock } from '../models/stock.schema';
import { logger } from '@ecommerce-backend/common';

export interface ReservationItem {
    productId: string;
    quantity: number;
}

export interface ReservationResult {
    success: boolean;
    reservationId?: string;
    failedItems?: Array<{
        productId: string;
        requestedQuantity: number;
        availableQuantity: number;
    }>;
    reason?: string;
}

/**
 * Generate unique reservation ID
 */
const generateReservationId = (): string => {
    return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get inventory for a product
 */
export const getInventory = async (productId: string) => {
    const stock = await Stock.findOne({ productId });
    if (!stock) {
        return null;
    }

    return {
        productId: stock.productId,
        available: stock.available,
        reserved: stock.reserved,
        total: stock.available + stock.reserved
    };
};

/**
 * Create or update stock for a product (admin operation)
 */
export const createOrUpdateStock = async (
    productId: string,
    available: number
): Promise<void> => {
    await Stock.findOneAndUpdate(
        { productId },
        { $set: { available } },
        { upsert: true, new: true }
    );

    logger.info(`Updated stock for product ${productId}: available=${available}`);
};

/**
 * Atomically check and reserve inventory using MongoDB transactions
 */
export const checkAndReserve = async (
    orderId: string,
    items: ReservationItem[]
): Promise<ReservationResult> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Step 1: Check stock availability for all items
        const stockChecks = await Promise.all(
            items.map(item =>
                Stock.findOne({ productId: item.productId }).session(session)
            )
        );

        const failedItems: Array<{
            productId: string;
            requestedQuantity: number;
            availableQuantity: number;
        }> = [];

        for (let i = 0; i < items.length; i++) {
            const stock = stockChecks[i];
            const item = items[i];

            if (!stock) {
                failedItems.push({
                    productId: item.productId,
                    requestedQuantity: item.quantity,
                    availableQuantity: 0
                });
            } else if (stock.available < item.quantity) {
                failedItems.push({
                    productId: item.productId,
                    requestedQuantity: item.quantity,
                    availableQuantity: stock.available
                });
            }
        }

        // If any item has insufficient stock, abort
        if (failedItems.length > 0) {
            await session.abortTransaction();
            session.endSession();

            const reason = failedItems
                .map(f => `${f.productId}: requested ${f.requestedQuantity}, available ${f.availableQuantity}`)
                .join('; ');

            logger.warn(`Reservation failed for order ${orderId}: ${reason}`);

            return {
                success: false,
                failedItems,
                reason: `Insufficient stock: ${reason}`
            };
        }

        // Step 2: Reserve all items atomically
        const reservationId = generateReservationId();

        for (const item of items) {
            await Stock.findOneAndUpdate(
                { productId: item.productId },
                {
                    $inc: {
                        available: -item.quantity,
                        reserved: item.quantity
                    }
                },
                { session }
            );
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        logger.info(`Successfully reserved inventory for order ${orderId}, reservationId: ${reservationId}`);

        return {
            success: true,
            reservationId
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        logger.error(`Error during inventory reservation for order ${orderId}:`, error);

        return {
            success: false,
            reason: `Transaction failed: ${(error as Error).message}`
        };
    }
};

/**
 * Release a reservation (rollback)
 */
export const releaseReservation = async (
    items: ReservationItem[]
): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        for (const item of items) {
            await Stock.findOneAndUpdate(
                { productId: item.productId },
                {
                    $inc: {
                        available: item.quantity,
                        reserved: -item.quantity
                    }
                },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        logger.info(`Released reservation for ${items.length} items`);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`Error releasing reservation:`, error);
        throw error;
    }
};
