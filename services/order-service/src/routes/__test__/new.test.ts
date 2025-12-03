import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { kafkaWrapper } from '../../kafka-wrapper';
import mongoose from 'mongoose';

it('returns an error if the order has invalid inputs', async () => {
    await request(app)
        .post('/api/v1/orders')
        .send({
            items: [],
        })
        .expect(400);

    await request(app)
        .post('/api/v1/orders')
        .send({
            items: [{ productId: '123', quantity: 0, price: 10 }],
        })
        .expect(400);
});

it('creates an order with valid inputs', async () => {
    const productId = new mongoose.Types.ObjectId().toHexString();

    const response = await request(app)
        .post('/api/v1/orders')
        .send({
            items: [{ productId, quantity: 2, price: 20 }],
        })
        .expect(201);

    const order = await Order.findById(response.body.id);
    expect(order).toBeDefined();
    expect(order!.status).toEqual(OrderStatus.Pending);
    expect(order!.totalAmount).toEqual(40);
});

it('publishes an order created event', async () => {
    const productId = new mongoose.Types.ObjectId().toHexString();

    await request(app)
        .post('/api/v1/orders')
        .send({
            items: [{ productId, quantity: 2, price: 20 }],
        })
        .expect(201);

    expect(kafkaWrapper.producer.send).toHaveBeenCalled();
});
