import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { NotFoundError, ApiError, logger } from '@ecommerce-backend/common';
import { inventoryRoutes } from './routes/inventory.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/v1/inventory', inventoryRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'inventory-service' });
});

// 404 Handler
app.all('*', (req, res, next) => {
    next(new NotFoundError('Route not found'));
});

// Global Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    logger.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
});

export { app };
