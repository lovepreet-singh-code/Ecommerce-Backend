import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as inventoryService from '../services/inventory.service';
import { ApiError } from '@ecommerce-backend/common';

// Request validation schemas
const createStockSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    available: z.number().int().min(0, 'Available quantity must be non-negative')
});

/**
 * GET /api/v1/inventory/:productId
 * Get inventory status for a product
 */
export const getInventoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            throw new ApiError(400, 'Product ID is required');
        }

        const inventory = await inventoryService.getInventory(productId);

        if (!inventory) {
            throw new ApiError(404, `Product ${productId} not found`);
        }

        res.status(200).json(inventory);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/inventory
 * Create or update stock (admin endpoint)
 */
export const createStockHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate request body
        const validation = createStockSchema.safeParse(req.body);
        if (!validation.success) {
            throw new ApiError(400, validation.error.errors[0].message);
        }

        const { productId, available } = validation.data;

        await inventoryService.createOrUpdateStock(productId, available);

        const inventory = await inventoryService.getInventory(productId);
        res.status(201).json(inventory);
    } catch (error) {
        next(error);
    }
};
