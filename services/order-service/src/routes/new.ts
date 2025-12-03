import express, { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError, createEvent } from '@ecommerce-backend/common';
import { Order, OrderStatus } from '../models/order';
import { kafkaWrapper } from '../kafka-wrapper';

const router = express.Router();

const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0)
    })).min(1),
    addressId: z.string().optional(),
    paymentMethod: z.string().optional()
});

router.post('/api/v1/orders', async (req: Request, res: Response) => {
    const validation = createOrderSchema.safeParse(req.body);

    if (!validation.success) {
        throw new BadRequestError(validation.error.errors.map(e => e.message).join(', '));
    }

    const { items } = validation.data;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const order = Order.build({
        userId: 'user-id-placeholder', // TODO: Get from current user (JWT)
        status: OrderStatus.Pending,
        items,
        totalAmount
    });

    await order.save();

    // Publish event
    const event = createEvent('order.created', {
        orderId: order.id,
        userId: order.userId,
        items: order.items,
        totalAmount: order.totalAmount,
        status: 'pending',
        createdAt: order.createdAt
    });

    await kafkaWrapper.producer.send('order.created', [{
        key: order.id,
        value: JSON.stringify(event)
    }]);

    res.status(201).send(order);
});

export { router as createOrderRouter };
