import express from 'express';
import * as inventoryController from '../controllers/inventory.controller';

const router = express.Router();

// GET /api/v1/inventory/:productId - Get inventory status
router.get('/:productId', inventoryController.getInventoryHandler);

// POST /api/v1/inventory - Create or update stock (admin)
router.post('/', inventoryController.createStockHandler);

export { router as inventoryRoutes };
