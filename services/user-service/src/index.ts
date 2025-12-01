import * as dotenv from 'dotenv';
import { logger, loadEnv } from '@ecommerce-backend/common';
import { connectDB } from './db';
import { app } from './app';

dotenv.config();

// Main startup function
const startServer = async () => {
    try {
        // Validate environment variables
        loadEnv(['PORT', 'MONGO_URI', 'JWT_SECRET']);

        // Connect to database
        await connectDB();

        // Start the server
        const PORT = process.env.PORT || 4000;

        app.listen(PORT, () => {
            logger.info(`✅ User Service listening on port ${PORT}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();
