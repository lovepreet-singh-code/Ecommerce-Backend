import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import * as cartController from '../controllers/cart.controller';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/v1/cart - Get cart
router.get('/', cartController.getCartHandler);

// POST /api/v1/cart - Add or update item
router.post('/', cartController.addItemHandler);

// PATCH /api/v1/cart - Update item quantity
router.patch('/', cartController.updateItemHandler);

// DELETE /api/v1/cart/:productId - Remove item
router.delete('/:productId', cartController.removeItemHandler);

// DELETE /api/v1/cart - Clear cart (bonus endpoint)
router.delete('/', cartController.clearCartHandler);

export { router as cartRoutes };
