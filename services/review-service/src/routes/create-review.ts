import express, { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '@ecommerce-backend/common';
import { Review } from '../models/review';

const router = express.Router();

const createReviewSchema = z.object({
    productId: z.string().min(1),
    rating: z.number().min(1).max(5),
    comment: z.string().min(1).max(1000),
});

router.post('/api/v1/reviews', async (req: Request, res: Response) => {
    const validation = createReviewSchema.safeParse(req.body);

    if (!validation.success) {
        throw new BadRequestError(validation.error.errors.map(e => e.message).join(', '));
    }

    const { productId, rating, comment } = validation.data;

    // TODO: Get userId from auth middleware
    const userId = req.headers['x-user-id'] as string || 'user-placeholder';

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
        throw new BadRequestError('You have already reviewed this product');
    }

    const review = Review.build({
        productId,
        userId,
        rating,
        comment,
    });

    await review.save();

    res.status(201).send(review);
});

export { router as createReviewRouter };
