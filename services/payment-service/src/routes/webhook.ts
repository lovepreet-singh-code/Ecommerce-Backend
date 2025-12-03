import express, { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '@ecommerce-backend/common';
import { PaymentStatus } from '../models/payment';
import { handleWebhook } from '../services/payment-processor';

const router = express.Router();

const webhookSchema = z.object({
    transactionId: z.string().min(1),
    status: z.nativeEnum(PaymentStatus),
});

router.post('/api/v1/payments/webhook', async (req: Request, res: Response) => {
    const validation = webhookSchema.safeParse(req.body);

    if (!validation.success) {
        throw new BadRequestError(validation.error.errors.map(e => e.message).join(', '));
    }

    const { transactionId, status } = validation.data;

    // Only accept success or failed status from webhook
    if (status !== PaymentStatus.Success && status !== PaymentStatus.Failed) {
        throw new BadRequestError('Invalid status. Must be success or failed');
    }

    const result = await handleWebhook(transactionId, status);

    if (!result.success) {
        return res.status(404).send({ error: result.message });
    }

    res.status(200).send({
        message: result.message,
        duplicate: result.duplicate || false,
    });
});

export { router as webhookRouter };
