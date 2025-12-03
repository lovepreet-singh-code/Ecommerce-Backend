import mongoose from 'mongoose';
import { SearchAdapter, Product } from './search-adapter.interface';

// Product schema for MongoDB text search
const productSchema = new mongoose.Schema({
    _id: String,
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: String,
    stock: Number,
});

// Create text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const ProductModel = mongoose.model('SearchProduct', productSchema);

export class MongoDBAdapter implements SearchAdapter {
    async index(product: Product): Promise<void> {
        await ProductModel.create({
            _id: product.id,
            ...product,
        });
    }

    async update(product: Product): Promise<void> {
        await ProductModel.findByIdAndUpdate(product.id, product, { upsert: true });
    }

    async search(query: string, limit: number = 20): Promise<Product[]> {
        const results = await ProductModel.find(
            { $text: { $search: query } },
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .lean();

        return results.map(doc => ({
            id: doc._id as string,
            name: doc.name,
            description: doc.description,
            price: doc.price,
            category: doc.category || undefined,
            stock: doc.stock || undefined,
        }));
    }

    async delete(productId: string): Promise<void> {
        await ProductModel.findByIdAndDelete(productId);
    }
}
