import request from 'supertest';
import { app } from '../../app';
import { Payment, PaymentStatus, PaymentMethod } from '../../models/payment';
import { kafkaWrapper } from '../../kafka-wrapper';

it('processes webhook and publishes event', async () => {
    // Create a payment first
    const payment = Payment.build({
        orderId: 'order-123',
        transactionId: 'txn-123',
        amount: 100,
        currency: 'USD',
        paymentMethod: PaymentMethod.Card,
        status: PaymentStatus.Pending,
    });
    await payment.save();

    // Send webhook
    await request(app)
        .post('/api/v1/payments/webhook')
        .send({
            transactionId: 'txn-123',
            status: PaymentStatus.Success,
        })
        .expect(200);

    // Verify payment updated
    const updatedPayment = await Payment.findById(payment.id);
    expect(updatedPayment!.status).toEqual(PaymentStatus.Success);
    expect(updatedPayment!.webhookProcessed).toBe(true);

    // Verify Kafka event published
    expect(kafkaWrapper.producer.send).toHaveBeenCalled();
});

it('handles duplicate webhooks idempotently', async () => {
    // Create a payment
    const payment = Payment.build({
        orderId: 'order-456',
        transactionId: 'txn-456',
        amount: 200,
        currency: 'USD',
        paymentMethod: PaymentMethod.UPI,
        status: PaymentStatus.Pending,
    });
    await payment.save();

    // Send webhook first time
    const response1 = await request(app)
        .post('/api/v1/payments/webhook')
        .send({
            transactionId: 'txn-456',
            status: PaymentStatus.Success,
        })
        .expect(200);

    expect(response1.body.duplicate).toBe(false);

    // Send webhook second time (duplicate)
    const response2 = await request(app)
        .post('/api/v1/payments/webhook')
        .send({
            transactionId: 'txn-456',
            status: PaymentStatus.Success,
        })
        .expect(200);

    expect(response2.body.duplicate).toBe(true);

    // Verify Kafka event only sent once
    expect(kafkaWrapper.producer.send).toHaveBeenCalledTimes(1);
});

it('handles payment failure webhook', async () => {
    const payment = Payment.build({
        orderId: 'order-789',
        transactionId: 'txn-789',
        amount: 50,
        currency: 'USD',
        paymentMethod: PaymentMethod.Wallet,
        status: PaymentStatus.Pending,
    });
    await payment.save();

    await request(app)
        .post('/api/v1/payments/webhook')
        .send({
            transactionId: 'txn-789',
            status: PaymentStatus.Failed,
        })
        .expect(200);

    const updatedPayment = await Payment.findById(payment.id);
    expect(updatedPayment!.status).toEqual(PaymentStatus.Failed);
    expect(updatedPayment!.webhookProcessed).toBe(true);
});

it('returns 404 for non-existent transaction', async () => {
    await request(app)
        .post('/api/v1/payments/webhook')
        .send({
            transactionId: 'non-existent',
            status: PaymentStatus.Success,
        })
        .expect(404);
});
