import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'api-gateway',
    });
});

router.get('/api/v1/gateway/info', (req: Request, res: Response) => {
    res.json({
        name: 'E-Commerce API Gateway',
        version: '1.0.0',
        services: {
            inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3000',
            order: process.env.ORDER_SERVICE_URL || 'http://localhost:3000',
            payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001',
            notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002',
            review: process.env.REVIEW_SERVICE_URL || 'http://localhost:3003',
            search: process.env.SEARCH_SERVICE_URL || 'http://localhost:3004',
        },
        endpoints: [
            'POST /api/v1/orders - Create order (auth required)',
            'GET /api/v1/orders/:id - Get order (auth required)',
            'POST /api/v1/payments - Create payment (auth required)',
            'GET /api/v1/notifications/user/:userId - Get notifications (auth required)',
            'POST /api/v1/reviews - Create review (auth required)',
            'GET /api/v1/reviews/product/:productId - Get reviews (public)',
            'GET /api/v1/search - Search products (public)',
            'GET /api/v1/inventory/:productId - Get inventory (admin only)',
        ],
    });
});

export { router as healthRoutes };
