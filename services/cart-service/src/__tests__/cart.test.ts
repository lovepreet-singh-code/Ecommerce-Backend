import request from 'supertest';
import RedisMock from 'ioredis-mock';
import { app } from '../app';
import jwt from 'jsonwebtoken';

// Mock the Redis client
jest.mock('../config/redis', () => {
    const redisMock = new RedisMock();
    return {
        getRedisClient: () => redisMock,
        connectRedis: jest.fn().mockResolvedValue(redisMock),
        disconnectRedis: jest.fn().mockResolvedValue(undefined)
    };
});

// Test JWT token
const generateToken = (userId: string = 'test-user-123') => {
    return jwt.sign(
        { userId, email: 'test@example.com', role: 'user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
};

describe('Cart Service Integration Tests', () => {
    let token: string;

    beforeAll(() => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.CART_TTL_SECONDS = '3600';
        token = generateToken();
    });

    beforeEach(async () => {
        // Clear Redis mock before each test
        const { getRedisClient } = require('../config/redis');
        const redis = getRedisClient();
        await redis.flushall();
    });

    describe('GET /api/v1/cart', () => {
        it('should return empty cart for new user', async () => {
            const response = await request(app)
                .get('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('userId', 'test-user-123');
            expect(response.body).toHaveProperty('items');
            expect(response.body.items).toHaveLength(0);
        });

        it('should return 401 without auth token', async () => {
            const response = await request(app).get('/api/v1/cart');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/cart', () => {
        it('should add item to cart', async () => {
            const response = await request(app)
                .post('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: 'prod-123',
                    qty: 2,
                    priceSnapshot: 99.99
                });

            expect(response.status).toBe(200);
            expect(response.body.items).toHaveLength(1);
            expect(response.body.items[0]).toMatchObject({
                productId: 'prod-123',
                qty: 2,
                priceSnapshot: 99.99
            });
        });

        it('should update existing item quantity', async () => {
            // Add item first
            await request(app)
                .post('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: 'prod-123',
                    qty: 2
                });

            // Update quantity
            const response = await request(app)
                .post('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: 'prod-123',
                    qty: 5
                });

            expect(response.status).toBe(200);
            expect(response.body.items).toHaveLength(1);
            expect(response.body.items[0].qty).toBe(5);
        });

        it('should validate request body', async () => {
            const response = await request(app)
                .post('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: '',
                    qty: -1
                });

            expect(response.status).toBe(400);
        });
    });

    describe('PATCH /api/v1/cart', () => {
        it('should update item quantity', async () => {
            // Add item first
            await request(app)
                .post('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: 'prod-123',
                    qty: 2
                });

            // Update quantity
            const response = await request(app)
                .patch('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: 'prod-123',
                    qty: 10
                });

            expect(response.status).toBe(200);
            expect(response.body.items[0].qty).toBe(10);
        });

        it('should return 404 for non-existent item', async () => {
            const response = await request(app)
                .patch('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: 'non-existent',
                    qty: 5
                });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/v1/cart/:productId', () => {
        it('should remove item from cart', async () => {
            // Add item first
            await request(app)
                .post('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: 'prod-123',
                    qty: 2
                });

            // Remove item
            const response = await request(app)
                .delete('/api/v1/cart/prod-123')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.items).toHaveLength(0);
        });

        it('should return 404 for non-existent item', async () => {
            const response = await request(app)
                .delete('/api/v1/cart/non-existent')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('Cart Operations Sequence', () => {
        it('should handle complete cart workflow', async () => {
            // 1. Start with empty cart
            let response = await request(app)
                .get('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`);
            expect(response.body.items).toHaveLength(0);

            // 2. Add first item
            response = await request(app)
                .post('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: 'prod-1',
                    qty: 2,
                    priceSnapshot: 29.99
                });
            expect(response.body.items).toHaveLength(1);

            // 3. Add second item
            response = await request(app)
                .post('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: 'prod-2',
                    qty: 1,
                    priceSnapshot: 49.99
                });
            expect(response.body.items).toHaveLength(2);

            // 4. Update first item quantity
            response = await request(app)
                .patch('/api/v1/cart')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    productId: 'prod-1',
                    qty: 5
                });
            expect(response.body.items[0].qty).toBe(5);

            // 5. Remove second item
            response = await request(app)
                .delete('/api/v1/cart/prod-2')
                .set('Authorization', `Bearer ${token}`);
            expect(response.body.items).toHaveLength(1);
            expect(response.body.items[0].productId).toBe('prod-1');
        });
    });

    describe('User Isolation', () => {
        it('should isolate carts between different users', async () => {
            const token1 = generateToken('user-1');
            const token2 = generateToken('user-2');

            // Add item to user 1 cart
            await request(app)
                .post('/api/v1/cart')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    productId: 'prod-123',
                    qty: 2
                });

            // Check user 2 cart is empty
            const response = await request(app)
                .get('/api/v1/cart')
                .set('Authorization', `Bearer ${token2}`);

            expect(response.body.items).toHaveLength(0);
        });
    });
});
