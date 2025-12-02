import { getRedisClient } from '../config/redis';
import { Cart, CartItem } from '../types/cart.types';
import { logger } from '@ecommerce-backend/common';

const CART_KEY_PREFIX = 'cart:';
const DEFAULT_TTL = parseInt(process.env.CART_TTL_SECONDS || '604800', 10); // 7 days

/**
 * Get cart TTL from environment or use default
 */
const getCartTTL = (): number => {
    return DEFAULT_TTL;
};

/**
 * Generate Redis key for user cart
 */
const getCartKey = (userId: string): string => {
    return `${CART_KEY_PREFIX}${userId}`;
};

/**
 * Get cart for a user
 */
export const getCart = async (userId: string): Promise<Cart> => {
    const redis = getRedisClient();
    const key = getCartKey(userId);

    const data = await redis.get(key);

    if (!data) {
        // Return empty cart
        return {
            userId,
            items: [],
            updatedAt: new Date().toISOString()
        };
    }

    const cart: Cart = JSON.parse(data);
    logger.info(`📦 Retrieved cart for user ${userId} with ${cart.items.length} items`);
    return cart;
};

/**
 * Add or update item in cart
 */
export const addItem = async (
    userId: string,
    productId: string,
    qty: number,
    priceSnapshot?: number
): Promise<Cart> => {
    const redis = getRedisClient();
    const key = getCartKey(userId);

    // Get current cart
    const cart = await getCart(userId);

    // Find existing item
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingItemIndex >= 0) {
        // Update existing item
        cart.items[existingItemIndex].qty = qty;
        if (priceSnapshot !== undefined) {
            cart.items[existingItemIndex].priceSnapshot = priceSnapshot;
        }
        logger.info(`🔄 Updated item ${productId} qty to ${qty} for user ${userId}`);
    } else {
        // Add new item
        const newItem: CartItem = {
            productId,
            qty,
            priceSnapshot
        };
        cart.items.push(newItem);
        logger.info(`➕ Added item ${productId} (qty: ${qty}) to cart for user ${userId}`);
    }

    cart.updatedAt = new Date().toISOString();

    // Save to Redis with TTL
    await redis.setex(key, getCartTTL(), JSON.stringify(cart));

    return cart;
};

/**
 * Update item quantity in cart
 */
export const updateItem = async (
    userId: string,
    productId: string,
    qty: number
): Promise<Cart> => {
    const redis = getRedisClient();
    const key = getCartKey(userId);

    // Get current cart
    const cart = await getCart(userId);

    // Find item
    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex < 0) {
        throw new Error(`Product ${productId} not found in cart`);
    }

    // Update quantity
    cart.items[itemIndex].qty = qty;
    cart.updatedAt = new Date().toISOString();

    // Save to Redis with TTL
    await redis.setex(key, getCartTTL(), JSON.stringify(cart));

    logger.info(`🔄 Updated item ${productId} qty to ${qty} for user ${userId}`);
    return cart;
};

/**
 * Remove item from cart
 */
export const removeItem = async (userId: string, productId: string): Promise<Cart> => {
    const redis = getRedisClient();
    const key = getCartKey(userId);

    // Get current cart
    const cart = await getCart(userId);

    // Find item
    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex < 0) {
        throw new Error(`Product ${productId} not found in cart`);
    }

    // Remove item
    cart.items.splice(itemIndex, 1);
    cart.updatedAt = new Date().toISOString();

    if (cart.items.length === 0) {
        // Delete cart if empty
        await redis.del(key);
        logger.info(`🗑️  Removed cart for user ${userId} (was empty)`);
    } else {
        // Save to Redis with TTL
        await redis.setex(key, getCartTTL(), JSON.stringify(cart));
        logger.info(`➖ Removed item ${productId} from cart for user ${userId}`);
    }

    return cart;
};

/**
 * Clear entire cart for user
 */
export const clearCart = async (userId: string): Promise<void> => {
    const redis = getRedisClient();
    const key = getCartKey(userId);

    await redis.del(key);
    logger.info(`🗑️  Cleared cart for user ${userId}`);
};
