import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { productRouter } from './routes/product.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/v1/products', productRouter);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

export { app };
