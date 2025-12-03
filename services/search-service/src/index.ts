import mongoose from 'mongoose';
import { app } from './app';
import { createConsumer, logger } from '@ecommerce-backend/common';
import { searchService } from './search-service';
import { MeiliSearchAdapter } from './adapters/meilisearch-adapter';
import { MongoDBAdapter } from './adapters/mongodb-adapter';
import { productCreatedConsumer } from './events/consumers/product-created-consumer';
import { productUpdatedConsumer } from './events/consumers/product-updated-consumer';
import dotenv from 'dotenv';

dotenv.config();

const start = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI must be defined');
    }
    if (!process.env.KAFKA_BROKERS) {
        throw new Error('KAFKA_BROKERS must be defined');
    }

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Connected to MongoDB');

        // Initialize search adapter
        const searchProvider = process.env.SEARCH_PROVIDER || 'mongodb';

        if (searchProvider === 'meilisearch') {
            const meiliHost = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
            const meiliKey = process.env.MEILISEARCH_API_KEY;
            searchService.adapter = new MeiliSearchAdapter(meiliHost, meiliKey);
            logger.info('Using MeiliSearch adapter');
        } else {
            searchService.adapter = new MongoDBAdapter();
            logger.info('Using MongoDB adapter (fallback)');
        }

        // Connect to Kafka Consumer
        const brokers = process.env.KAFKA_BROKERS.split(',');
        const consumer = await createConsumer(brokers, 'search-service-consumer', 'search-service-group');
        await consumer.subscribe('product.created', productCreatedConsumer);
        await consumer.subscribe('product.updated', productUpdatedConsumer);

        // Start Server
        const port = process.env.PORT || 3004;
        app.listen(port, () => {
            logger.info(`Search Service listening on port ${port}`);
        });
    } catch (err) {
        logger.error('Failed to start service:', err);
        process.exit(1);
    }
};

start();
