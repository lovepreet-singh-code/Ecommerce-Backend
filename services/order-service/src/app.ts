import express from 'express';
import 'express-async-errors';
import { json } from 'express';
import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
import { NotFoundError } from '@ecommerce-backend/common';
import { errorHandler } from './middlewares/error-handler';
import { createOrderRouter } from './routes/new';
import { showOrderRouter } from './routes/show';
import { patchOrderRouter } from './routes/patch';

const app = express();

app.set('trust proxy', true);
app.use(json());
app.use(cors());
// app.use(helmet());
// app.use(morgan('dev'));

app.use(createOrderRouter);
app.use(showOrderRouter);
app.use(patchOrderRouter);

app.all('*', async (req, res) => {
    throw new NotFoundError('Route not found');
});

app.use(errorHandler);

export { app };
