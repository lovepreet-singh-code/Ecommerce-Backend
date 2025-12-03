import express, { Request, Response } from 'express';
import { Review } from '../models/review';

const router = express.Router();

router.get('/api/v1/reviews/product/:productId', async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { limit = '20', skip = '0', sortBy = 'createdAt', order = 'desc' } = req.query;

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sortBy === 'rating' ? 'rating' : 'createdAt';

    const reviews = await Review.find({ productId })
        .sort({ [sortField]: sortOrder })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string));

    const total = await Review.countDocuments({ productId });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
        { $match: { productId } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
            },
        },
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0 };

    res.send({
        reviews,
        total,
        averageRating: stats.averageRating,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
    });
});

export { router as getProductReviewsRouter };
