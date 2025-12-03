import { app } from './app';
import { config } from './config';
import dotenv from 'dotenv';

dotenv.config();

const start = () => {
    try {
        app.listen(config.port, () => {
            console.log('='.repeat(50));
            console.log('🚀 API Gateway Started');
            console.log('='.repeat(50));
            console.log(`📍 Port: ${config.port}`);
            console.log(`🌍 Environment: ${config.nodeEnv}`);
            console.log(`\n📡 Service Routes:`);
            console.log(`   - User: ${process.env.USER_SERVICE_URL || 'http://localhost:4000'}`);
            console.log(`   - Product: ${process.env.PRODUCT_SERVICE_URL || 'http://localhost:4001'}`);
            console.log(`   - Cart: ${process.env.CART_SERVICE_URL || 'http://localhost:4002'}`);
            console.log(`   - Inventory: ${process.env.INVENTORY_SERVICE_URL || 'http://localhost:4003'}`);
            console.log(`   - Order: ${process.env.ORDER_SERVICE_URL || 'http://localhost:3000'}`);
            console.log(`   - Payment: ${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001'}`);
            console.log(`   - Notification: ${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002'}`);
            console.log(`   - Review: ${process.env.REVIEW_SERVICE_URL || 'http://localhost:3003'}`);
            console.log(`   - Search: ${process.env.SEARCH_SERVICE_URL || 'http://localhost:3004'}`);
            console.log(`\n📋 Gateway Info: http://localhost:${config.port}/api/v1/gateway/info`);
            console.log(`💚 Health Check: http://localhost:${config.port}/health`);
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('Failed to start API Gateway:', error);
        process.exit(1);
    }
};

start();
