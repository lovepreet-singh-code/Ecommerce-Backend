import { createEvent } from '@ecommerce-backend/common';
import { createProducer } from '@ecommerce-backend/common';

/**
 * Simulation script to demonstrate the full order lifecycle:
 * 1. Create an order (via API)
 * 2. Simulate inventory.reserved event
 * 3. Simulate payment.success event
 * 4. Verify order status transitions: PENDING -> RESERVED -> PAID
 */

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

async function simulateInventoryReserved(orderId: string) {
    const producer = await createProducer(KAFKA_BROKERS, 'simulation-producer');

    const event = createEvent('inventory.reserved', {
        orderId,
        reservationId: `res-${Date.now()}`,
        items: [
            {
                productId: 'prod-123',
                quantity: 2
            }
        ],
        reservedAt: new Date().toISOString()
    }, orderId);

    await producer.send('inventory.reserved', [{
        key: orderId,
        value: JSON.stringify(event)
    }]);

    console.log(`✅ Sent inventory.reserved event for order ${orderId}`);
    await producer.disconnect();
}

async function simulatePaymentSuccess(orderId: string) {
    const producer = await createProducer(KAFKA_BROKERS, 'simulation-producer');

    const event = createEvent('payment.success', {
        orderId,
        paymentId: `pay-${Date.now()}`,
        amount: 40,
        currency: 'USD',
        paymentMethod: 'card' as const,
        transactionId: `txn-${Date.now()}`,
        paidAt: new Date().toISOString()
    }, orderId);

    await producer.send('payment.success', [{
        key: orderId,
        value: JSON.stringify(event)
    }]);

    console.log(`✅ Sent payment.success event for order ${orderId}`);
    await producer.disconnect();
}

async function simulateInventoryFailed(orderId: string) {
    const producer = await createProducer(KAFKA_BROKERS, 'simulation-producer');

    const event = createEvent('inventory.failed', {
        orderId,
        items: [
            {
                productId: 'prod-123',
                requestedQuantity: 2,
                availableQuantity: 0
            }
        ],
        reason: 'Insufficient stock',
        failedAt: new Date().toISOString()
    }, orderId);

    await producer.send('inventory.failed', [{
        key: orderId,
        value: JSON.stringify(event)
    }]);

    console.log(`✅ Sent inventory.failed event for order ${orderId}`);
    await producer.disconnect();
}

// Export functions for use in tests or manual simulation
export {
    simulateInventoryReserved,
    simulatePaymentSuccess,
    simulateInventoryFailed
};

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    const orderId = args[1];

    if (!orderId) {
        console.error('Usage: ts-node simulate-events.ts <command> <orderId>');
        console.error('Commands: inventory-reserved, payment-success, inventory-failed');
        process.exit(1);
    }

    (async () => {
        try {
            switch (command) {
                case 'inventory-reserved':
                    await simulateInventoryReserved(orderId);
                    break;
                case 'payment-success':
                    await simulatePaymentSuccess(orderId);
                    break;
                case 'inventory-failed':
                    await simulateInventoryFailed(orderId);
                    break;
                default:
                    console.error(`Unknown command: ${command}`);
                    process.exit(1);
            }
        } catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    })();
}
