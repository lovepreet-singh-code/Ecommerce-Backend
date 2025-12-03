import express from 'express';
import 'express-async-errors';
import { json } from 'express';
import cors from 'cors';
import { NotFoundError } from '@ecommerce-backend/common';
import { errorHandler } from './middlewares/error-handler';
import { createReviewRouter } from './routes/create-review';
import { getProductReviewsRouter } from './routes/get-product-reviews';
import { deleteReviewRouter } from './routes/delete-review';

const app = express();

app.set('trust proxy', true);
app.use(json());
app.use(cors());

app.use(createReviewRouter);
app.use(getProductReviewsRouter);
app.use(deleteReviewRouter);

app.all('*', async (req, res) => {
    throw new NotFoundError('Route not found');
});

app.use(errorHandler);

export { app };
