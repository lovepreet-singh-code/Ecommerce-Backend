import { logger } from '@ecommerce-backend/common';
import { searchService } from '../../search-service';

export const productUpdatedConsumer = async (event: any) => {
    const { productId, name, description, price, category, stock } = event.data;

    try {
        await searchService.adapter.update({
            id: productId,
            name,
            description,
            price,
            category,
            stock,
        });

        logger.info(`Updated product ${productId} in search index`);
    } catch (error) {
        logger.error(`Failed to update product ${productId}:`, error);
    }
};
