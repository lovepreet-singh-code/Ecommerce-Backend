import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Sample data
const users = [
    { id: 'buyer-1', email: 'buyer@example.com', role: 'buyer', name: 'John Buyer' },
    { id: 'seller-1', email: 'seller@example.com', role: 'seller', name: 'Jane Seller' },
    { id: 'admin-1', email: 'admin@example.com', role: 'admin', name: 'Admin User' },
];

const products = [
    {
        _id: 'prod-1',
        name: 'Gaming Laptop',
        description: 'High-performance gaming laptop with RTX 4090',
        price: 1999.99,
        category: 'Electronics',
        sellerId: 'seller-1',
    },
    {
        _id: 'prod-2',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with 6 buttons',
        price: 29.99,
        category: 'Electronics',
        sellerId: 'seller-1',
    },
    {
        _id: 'prod-3',
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with Cherry MX switches',
        price: 149.99,
        category: 'Electronics',
        sellerId: 'seller-1',
    },
    {
        _id: 'prod-4',
        name: 'USB-C Hub',
        description: '7-in-1 USB-C hub with HDMI and ethernet',
        price: 49.99,
        category: 'Accessories',
        sellerId: 'seller-1',
    },
    {
        _id: 'prod-5',
        name: 'Laptop Stand',
        description: 'Adjustable aluminum laptop stand',
        price: 39.99,
        category: 'Accessories',
        sellerId: 'seller-1',
    },
];

const stocks = products.map(p => ({
    _id: p._id,
    productId: p._id,
    available: Math.floor(Math.random() * 50) + 10,
    reserved: 0,
}));

async function seedData() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        const collections = await mongoose.connection.db!.collections();
        for (const collection of collections) {
            await collection.deleteMany({});
        }
        console.log('🗑️  Cleared existing data');

        // Seed products (for product-service if it exists)
        const ProductModel = mongoose.model('Product', new mongoose.Schema({
            _id: String,
            name: String,
            description: String,
            price: Number,
            category: String,
            sellerId: String,
        }));

        await ProductModel.insertMany(products);
        console.log(`✅ Seeded ${products.length} products`);

        // Seed stocks (for inventory-service)
        const StockModel = mongoose.model('Stock', new mongoose.Schema({
            _id: String,
            productId: String,
            available: Number,
            reserved: Number,
        }));

        await StockModel.insertMany(stocks);
        console.log(`✅ Seeded ${stocks.length} stock records`);

        // Seed search index (for search-service)
        const SearchProductModel = mongoose.model('SearchProduct', new mongoose.Schema({
            _id: String,
            name: String,
            description: String,
            price: Number,
            category: String,
            stock: Number,
        }));

        await SearchProductModel.insertMany(products.map((p, i) => ({
            _id: p._id,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            stock: stocks[i].available,
        })));
        console.log(`✅ Seeded ${products.length} search index records`);

        console.log('\n🎉 Seed data completed successfully!');
        console.log('\nSample Users:');
        users.forEach(u => console.log(`  - ${u.role}: ${u.email} (ID: ${u.id})`));
        console.log('\nSample Products:');
        products.forEach(p => console.log(`  - ${p.name}: $${p.price}`));

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

seedData();
