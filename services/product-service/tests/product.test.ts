import request from 'supertest';
import { app } from '../src/app';
import * as redisClient from '../src/cache/redisClient';
import { Product } from '../src/models/product.schema';

// Mock the redis client methods
jest.mock('../src/cache/redisClient', () => ({
    connectRedis: jest.fn(),
    getCache: jest.fn(),
    setCache: jest.fn(),
    delCache: jest.fn(),
}));

describe('Product Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createProduct = async () => {
        return request(app)
            .post('/api/v1/products')
            .send({
                title: 'Test Product',
                description: 'Test Description',
                price: 100,
                category: 'Test Category',
                stock: 10,
                sellerId: 'seller123',
            });
    };

    it('should create a product and invalidate cache', async () => {
        const res = await createProduct();
        expect(res.status).toBe(201);
        expect(res.body.title).toEqual('Test Product');

        // Verify cache invalidation
        expect(redisClient.delCache).toHaveBeenCalledWith('products:list:*');
    });

    it('should cache product list on miss', async () => {
        // Mock cache miss
        (redisClient.getCache as jest.Mock).mockResolvedValue(null);

        // Create a product first so list isn't empty
        await createProduct();

        const res = await request(app).get('/api/v1/products').expect(200);
        expect(res.body.length).toBeGreaterThan(0);

        // Verify setCache was called
        expect(redisClient.setCache).toHaveBeenCalled();
        // Verify key contains query
        const callArgs = (redisClient.setCache as jest.Mock).mock.calls[0];
        expect(callArgs[0]).toContain('products:list:');
    });

    it('should return cached product list on hit', async () => {
        const cachedData = JSON.stringify([{ title: 'Cached Product' }]);
        // Mock cache hit
        (redisClient.getCache as jest.Mock).mockResolvedValue(cachedData);

        const res = await request(app).get('/api/v1/products').expect(200);

        expect(res.body[0].title).toEqual('Cached Product');
        // Verify DB was NOT queried (implied by returning cached data which differs from DB)
    });

    it('should cache single product on miss', async () => {
        const createRes = await createProduct();
        const productId = createRes.body.id;

        // Mock cache miss
        (redisClient.getCache as jest.Mock).mockResolvedValue(null);

        await request(app).get(`/api/v1/products/${productId}`).expect(200);

        // Verify setCache was called for specific product
        expect(redisClient.setCache).toHaveBeenCalledWith(
            `products:${productId}`,
            expect.any(String),
            expect.any(Number)
        );
    });
});
