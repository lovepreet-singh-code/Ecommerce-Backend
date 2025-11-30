import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger, loadEnv, NotFoundError, ApiError } from '@ecommerce-backend/common';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';

dotenv.config();

try {
    loadEnv(['PORT', 'MONGO_URI', 'JWT_SECRET']);
} catch (error) {
    logger.error(error);
    process.exit(1);
}

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'user-service' });
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

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    logger.info(`User Service listening on port ${PORT}`);
});
