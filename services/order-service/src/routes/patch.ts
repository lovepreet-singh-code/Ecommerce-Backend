import express, { Request, Response } from 'express';
import { NotFoundError, BadRequestError } from '@ecommerce-backend/common';
import { Order, OrderStatus } from '../models/order';
import { z } from 'zod';

const router = express.Router();

const updateOrderSchema = z.object({
    status: z.nativeEnum(OrderStatus)
});

router.patch('/api/v1/orders/:id/status', async (req: Request, res: Response) => {
    const validation = updateOrderSchema.safeParse(req.body);

    if (!validation.success) {
        throw new BadRequestError('Invalid status');
    }

    const { status } = validation.data;

    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new NotFoundError('Order not found');
    }

    order.set({ status });
    await order.save();

    res.send(order);
});

export { router as patchOrderRouter };
