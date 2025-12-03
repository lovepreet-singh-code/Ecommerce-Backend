export const serviceRoutes = {
    user: process.env.USER_SERVICE_URL || 'http://localhost:4000',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:4001',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:4002',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:4003',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:3000',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002',
    review: process.env.REVIEW_SERVICE_URL || 'http://localhost:3003',
    search: process.env.SEARCH_SERVICE_URL || 'http://localhost:3004',
};

export const config = {
    port: process.env.PORT || 8000,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    nodeEnv: process.env.NODE_ENV || 'development',
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // limit each IP to 100 requests per windowMs
};
