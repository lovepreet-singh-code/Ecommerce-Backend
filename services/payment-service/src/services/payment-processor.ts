import { Payment, PaymentStatus } from '../models/payment';
import { createEvent } from '@ecommerce-backend/common';
import { kafkaWrapper } from '../kafka-wrapper';

/**
 * Process payment asynchronously with optional delay
 * Simulates payment processing and triggers webhook
 */
export async function processPayment(paymentId: string) {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
        console.error(`Payment not found: ${paymentId}`);
        return;
    }

    // Apply delay if specified
    if (payment.simulationParams?.delayMs) {
        await new Promise(resolve => setTimeout(resolve, payment.simulationParams!.delayMs));
    }

    // Determine success or failure based on simulation params
    const shouldFail = payment.simulationParams?.shouldFail || false;
    const status = shouldFail ? PaymentStatus.Failed : PaymentStatus.Success;

    // Simulate webhook callback (internal)
    await handleWebhook(payment.transactionId, status);
}

/**
 * Handle webhook (can be called internally or via API)
 * Implements idempotency to prevent duplicate event publishing
 */
export async function handleWebhook(transactionId: string, status: PaymentStatus) {
    const payment = await Payment.findOne({ transactionId });

    if (!payment) {
        console.error(`Payment not found for transaction: ${transactionId}`);
        return { success: false, message: 'Payment not found' };
    }

    // Idempotency check
    if (payment.webhookProcessed) {
        console.log(`Webhook already processed for transaction: ${transactionId}`);
        return { success: true, message: 'Already processed', duplicate: true };
    }

    // Update payment status
    payment.status = status;
    payment.webhookProcessed = true;
    await payment.save();

    // Publish Kafka event
    const eventType = status === PaymentStatus.Success ? 'payment.success' : 'payment.failed';

    if (status === PaymentStatus.Success) {
        const event = createEvent('payment.success', {
            orderId: payment.orderId,
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            paidAt: new Date().toISOString(),
        }, payment.orderId);

        await kafkaWrapper.producer.send('payment.success', [{
            key: payment.orderId,
            value: JSON.stringify(event),
        }]);

        console.log(`✅ Published payment.success event for order ${payment.orderId}`);
    } else {
        const event = createEvent('payment.failed', {
            orderId: payment.orderId,
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            reason: 'Payment simulation failed',
            errorCode: 'SIMULATION_FAILURE',
            failedAt: new Date().toISOString(),
        }, payment.orderId);

        await kafkaWrapper.producer.send('payment.failed', [{
            key: payment.orderId,
            value: JSON.stringify(event),
        }]);

        console.log(`❌ Published payment.failed event for order ${payment.orderId}`);
    }

    return { success: true, message: 'Webhook processed', duplicate: false };
}
