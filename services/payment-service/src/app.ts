import express from 'express';
import 'express-async-errors';
import { json } from 'express';
import cors from 'cors';
import { NotFoundError } from '@ecommerce-backend/common';
import { errorHandler } from './middlewares/error-handler';
import { createPaymentRouter } from './routes/create-payment';
import { webhookRouter } from './routes/webhook';

const app = express();

app.set('trust proxy', true);
app.use(json());
app.use(cors());

app.use(createPaymentRouter);
app.use(webhookRouter);

app.all('*', async (req, res) => {
    throw new NotFoundError('Route not found');
});

app.use(errorHandler);

export { app };
