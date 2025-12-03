import express, { Request, Response } from 'express';
import { NotFoundError } from '@ecommerce-backend/common';
import { Order } from '../models/order';

const router = express.Router();

router.get('/api/v1/orders/:id', async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new NotFoundError('Order not found');
    }

    res.send(order);
});

export { router as showOrderRouter };
