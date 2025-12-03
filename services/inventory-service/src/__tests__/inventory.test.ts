import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../app';
import { Stock } from '../models/stock.schema';
import { ProcessedOrder } from '../models/processed-order.schema';
import * as inventoryService from '../services/inventory.service';
import * as idempotencyService from '../services/idempotency.service';
import { handleOrderCreated } from '../consumers/order-created.consumer';
import { OrderCreatedEvent } from '@ecommerce-backend/common';

let replSet: MongoMemoryReplSet;

// Mock Kafka producer
jest.mock('../kafka/producer', () => ({
    publishInventoryReserved: jest.fn(),
    publishInventoryFailed: jest.fn(),
    initializeProducer: jest.fn(),
    disconnectProducer: jest.fn()
}));

describe('Inventory Service Integration Tests', () => {
    beforeAll(async () => {
        replSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: 'wiredTiger' }
        });
        const mongoUri = replSet.getUri();
        await mongoose.connect(mongoUri);
    }, 60000);

    afterAll(async () => {
        await mongoose.disconnect();
        await replSet.stop();
    });

    beforeEach(async () => {
        await Stock.deleteMany({});
        await ProcessedOrder.deleteMany({});
    });

    describe('Stock Management', () => {
        it('should create stock for a product', async () => {
            await inventoryService.createOrUpdateStock('prod-1', 100);

            const inventory = await inventoryService.getInventory('prod-1');
            expect(inventory).not.toBeNull();
            expect(inventory?.available).toBe(100);
            expect(inventory?.reserved).toBe(0);
        });

        it('should update existing stock', async () => {
            await inventoryService.createOrUpdateStock('prod-1', 100);
            await inventoryService.createOrUpdateStock('prod-1', 150);

            const inventory = await inventoryService.getInventory('prod-1');
            expect(inventory?.available).toBe(150);
        });

        it('should return null for non-existent product', async () => {
            const inventory = await inventoryService.getInventory('non-existent');
            expect(inventory).toBeNull();
        });
    });

    describe('Atomic Reservation', () => {
        beforeEach(async () => {
            // Seed stock
            await inventoryService.createOrUpdateStock('prod-1', 10);
            await inventoryService.createOrUpdateStock('prod-2', 5);
        });

        it('should successfully reserve inventory for valid order', async () => {
            const result = await inventoryService.checkAndReserve('order-1', [
                { productId: 'prod-1', quantity: 3 },
                { productId: 'prod-2', quantity: 2 }
            ]);

            if (!result.success) {
                console.error('Reservation failed:', result.reason, result.failedItems);
            }

            expect(result.success).toBe(true);
            expect(result.reservationId).toBeDefined();

            // Verify stock updates
            const inv1 = await inventoryService.getInventory('prod-1');
            const inv2 = await inventoryService.getInventory('prod-2');

            expect(inv1?.available).toBe(7);
            expect(inv1?.reserved).toBe(3);
            expect(inv2?.available).toBe(3);
            expect(inv2?.reserved).toBe(2);
        });

        it('should fail when insufficient stock', async () => {
            const result = await inventoryService.checkAndReserve('order-2', [
                { productId: 'prod-1', quantity: 15 } // More than available
            ]);

            expect(result.success).toBe(false);
            expect(result.failedItems).toHaveLength(1);
            expect(result.failedItems?.[0].availableQuantity).toBe(10);

            // Verify no stock changes
            const inv = await inventoryService.getInventory('prod-1');
            expect(inv?.available).toBe(10);
            expect(inv?.reserved).toBe(0);
        });

        it('should rollback entire transaction if any item fails', async () => {
            const result = await inventoryService.checkAndReserve('order-3', [
                { productId: 'prod-1', quantity: 5 },  // OK
                { productId: 'prod-2', quantity: 10 }  // Too much
            ]);

            expect(result.success).toBe(false);

            // Verify BOTH items unchanged
            const inv1 = await inventoryService.getInventory('prod-1');
            const inv2 = await inventoryService.getInventory('prod-2');

            expect(inv1?.available).toBe(10);
            expect(inv1?.reserved).toBe(0);
            expect(inv2?.available).toBe(5);
            expect(inv2?.reserved).toBe(0);
        });

        it('should fail for non-existent product', async () => {
            const result = await inventoryService.checkAndReserve('order-4', [
                { productId: 'non-existent', quantity: 1 }
            ]);

            expect(result.success).toBe(false);
            expect(result.failedItems?.[0].availableQuantity).toBe(0);
        });
    });

    describe('Idempotency', () => {
        it('should detect already processed order', async () => {
            await idempotencyService.markProcessed(
                'order-1',
                'reserved',
                [{ productId: 'prod-1', quantity: 2 }],
                'res-123'
            );

            const isProcessed = await idempotencyService.isProcessed('order-1');
            expect(isProcessed).toBe(true);
        });

        it('should return false for new order', async () => {
            const isProcessed = await idempotencyService.isProcessed('order-new');
            expect(isProcessed).toBe(false);
        });

        it('should retrieve processed order details', async () => {
            await idempotencyService.markProcessed(
                'order-1',
                'reserved',
                [{ productId: 'prod-1', quantity: 2 }],
                'res-123'
            );

            const result = await idempotencyService.getProcessedOrder('order-1');
            expect(result?.status).toBe('reserved');
            expect(result?.reservationId).toBe('res-123');
        });
    });

    describe('Event Handler', () => {
        beforeEach(async () => {
            await inventoryService.createOrUpdateStock('prod-1', 10);
        });

        it('should handle order.created event successfully', async () => {
            const event: OrderCreatedEvent = {
                eventId: 'evt-1',
                eventType: 'order.created',
                data: {
                    orderId: 'order-1',
                    userId: 'user-1',
                    items: [{ productId: 'prod-1', quantity: 3, price: 99.99 }],
                    totalAmount: 299.97,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            await handleOrderCreated(event);

            // Verify stock updated
            const inv = await inventoryService.getInventory('prod-1');
            expect(inv?.available).toBe(7);
            expect(inv?.reserved).toBe(3);

            // Verify marked as processed
            const isProcessed = await idempotencyService.isProcessed('order-1');
            expect(isProcessed).toBe(true);
        });

        it('should skip already processed order', async () => {
            // Pre-mark as processed
            await idempotencyService.markProcessed(
                'order-1',
                'reserved',
                [{ productId: 'prod-1', quantity: 3 }],
                'res-123'
            );

            const event: OrderCreatedEvent = {
                eventId: 'evt-2',
                eventType: 'order.created',
                data: {
                    orderId: 'order-1',
                    userId: 'user-1',
                    items: [{ productId: 'prod-1', quantity: 3, price: 99.99 }],
                    totalAmount: 299.97,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            await handleOrderCreated(event);

            // Verify stock unchanged (still original)
            const inv = await inventoryService.getInventory('prod-1');
            expect(inv?.available).toBe(10);
            expect(inv?.reserved).toBe(0);
        });
    });

    describe('REST API', () => {
        beforeEach(async () => {
            await inventoryService.createOrUpdateStock('prod-1', 25);
        });

        it('GET /api/v1/inventory/:productId should return inventory status', async () => {
            const response = await request(app).get('/api/v1/inventory/prod-1');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                productId: 'prod-1',
                available: 25,
                reserved: 0,
                total: 25
            });
        });

        it('GET /api/v1/inventory/:productId should return 404 for non-existent product', async () => {
            const response = await request(app).get('/api/v1/inventory/non-existent');
            expect(response.status).toBe(404);
        });

        it('POST /api/v1/inventory should create new stock', async () => {
            const response = await request(app)
                .post('/api/v1/inventory')
                .send({ productId: 'prod-2', available: 50 });

            expect(response.status).toBe(201);
            expect(response.body.available).toBe(50);
        });

        it('POST /api/v1/inventory should validate request', async () => {
            const response = await request(app)
                .post('/api/v1/inventory')
                .send({ productId: '', available: -5 });

            expect(response.status).toBe(400);
        });
    });
});
