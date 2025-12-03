import express, { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '@ecommerce-backend/common';
import { Payment, PaymentMethod, PaymentStatus } from '../models/payment';
import { processPayment } from '../services/payment-processor';

const router = express.Router();

const createPaymentSchema = z.object({
    orderId: z.string().min(1),
    amount: z.number().min(0),
    currency: z.string().default('USD'),
    paymentMethod: z.nativeEnum(PaymentMethod),
    simulationParams: z.object({
        shouldFail: z.boolean().optional().default(false),
        delayMs: z.number().min(0).max(30000).optional().default(0),
    }).optional(),
});

router.post('/api/v1/payments', async (req: Request, res: Response) => {
    const validation = createPaymentSchema.safeParse(req.body);

    if (!validation.success) {
        throw new BadRequestError(validation.error.errors.map(e => e.message).join(', '));
    }

    const { orderId, amount, currency, paymentMethod, simulationParams } = validation.data;

    // Generate unique transaction ID
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = Payment.build({
        orderId,
        transactionId,
        amount,
        currency,
        paymentMethod,
        status: PaymentStatus.Pending,
        simulationParams,
    });

    await payment.save();

    // Process payment asynchronously (don't await)
    processPayment(payment.id).catch(err => {
        console.error('Error processing payment:', err);
    });

    res.status(201).send({
        id: payment.id,
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        createdAt: payment.createdAt,
    });
});

export { router as createPaymentRouter };
