import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as cartService from '../services/cart.service';
import { ApiError } from '@ecommerce-backend/common';

// Request validation schemas
const addItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    qty: z.number().int().positive('Quantity must be a positive integer'),
    priceSnapshot: z.number().positive().optional()
});

const updateItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    qty: z.number().int().positive('Quantity must be a positive integer')
});

/**
 * GET /api/v1/cart
 * Get user's cart
 */
export const getCartHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.currentUser!.userId;
        const cart = await cartService.getCart(userId);
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/cart
 * Add or update item in cart
 */
export const addItemHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.currentUser!.userId;

        // Validate request body
        const validation = addItemSchema.safeParse(req.body);
        if (!validation.success) {
            throw new ApiError(400, validation.error.errors[0].message);
        }

        const { productId, qty, priceSnapshot } = validation.data;

        const cart = await cartService.addItem(userId, productId, qty, priceSnapshot);
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/cart
 * Update item quantity
 */
export const updateItemHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.currentUser!.userId;

        // Validate request body
        const validation = updateItemSchema.safeParse(req.body);
        if (!validation.success) {
            throw new ApiError(400, validation.error.errors[0].message);
        }

        const { productId, qty } = validation.data;

        const cart = await cartService.updateItem(userId, productId, qty);
        res.status(200).json(cart);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            next(new ApiError(404, error.message));
        } else {
            next(error);
        }
    }
};

/**
 * DELETE /api/v1/cart/:productId
 * Remove item from cart
 */
export const removeItemHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.currentUser!.userId;
        const { productId } = req.params;

        if (!productId) {
            throw new ApiError(400, 'Product ID is required');
        }

        const cart = await cartService.removeItem(userId, productId);
        res.status(200).json(cart);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            next(new ApiError(404, error.message));
        } else {
            next(error);
        }
    }
};

/**
 * DELETE /api/v1/cart
 * Clear entire cart
 */
export const clearCartHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.currentUser!.userId;
        await cartService.clearCart(userId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
