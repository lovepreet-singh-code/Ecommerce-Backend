import request from 'supertest';
import { app } from '../../app';
import { Payment, PaymentStatus, PaymentMethod } from '../../models/payment';
import { kafkaWrapper } from '../../kafka-wrapper';

it('creates a payment with valid inputs', async () => {
    const response = await request(app)
        .post('/api/v1/payments')
        .send({
            orderId: 'order-123',
            amount: 100,
            currency: 'USD',
            paymentMethod: PaymentMethod.Card,
        })
        .expect(201);

    expect(response.body.orderId).toEqual('order-123');
    expect(response.body.status).toEqual(PaymentStatus.Pending);
    expect(response.body.transactionId).toBeDefined();

    const payment = await Payment.findById(response.body.id);
    expect(payment).toBeDefined();
});

it('creates a payment with simulation params', async () => {
    const response = await request(app)
        .post('/api/v1/payments')
        .send({
            orderId: 'order-456',
            amount: 200,
            currency: 'USD',
            paymentMethod: PaymentMethod.UPI,
            simulationParams: {
                shouldFail: true,
                delayMs: 100,
            },
        })
        .expect(201);

    const payment = await Payment.findById(response.body.id);
    expect(payment!.simulationParams?.shouldFail).toBe(true);
    expect(payment!.simulationParams?.delayMs).toBe(100);
});

it('returns error for invalid payment method', async () => {
    await request(app)
        .post('/api/v1/payments')
        .send({
            orderId: 'order-789',
            amount: 50,
            currency: 'USD',
            paymentMethod: 'invalid',
        })
        .expect(400);
});
