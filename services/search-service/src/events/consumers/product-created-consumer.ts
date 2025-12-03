import { logger } from '@ecommerce-backend/common';
import { searchService } from '../../search-service';

export const productCreatedConsumer = async (event: any) => {
    const { productId, name, description, price, category, stock } = event.data;

    try {
        await searchService.adapter.index({
            id: productId,
            name,
            description,
            price,
            category,
            stock,
        });

        logger.info(`Indexed product ${productId} in search`);
    } catch (error) {
        logger.error(`Failed to index product ${productId}:`, error);
    }
};
