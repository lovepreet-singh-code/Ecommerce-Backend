#!/usr/bin/env ts-node

/**
 * Acceptance Test Script
 * 
 * Tests the complete order flow:
 * 1. Create order
 * 2. Simulate payment
 * 3. Verify order status is PAID
 */

import axios from 'axios';

const ORDER_SERVICE = 'http://localhost:3000';
const PAYMENT_SERVICE = 'http://localhost:3001';

interface OrderResponse {
    id: string;
    status: string;
    totalAmount: number;
}

interface PaymentResponse {
    transactionId: string;
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAcceptanceTest() {
    console.log('🧪 Starting Acceptance Test\n');

    try {
        // Step 1: Create Order
        console.log('1️⃣  Creating order...');
        const orderResponse = await axios.post<OrderResponse>(`${ORDER_SERVICE}/api/v1/orders`, {
            items: [
                {
                    productId: 'prod-123',
                    quantity: 2,
                    price: 20,
                },
            ],
        });

        const orderId = orderResponse.data.id;
        const totalAmount = orderResponse.data.totalAmount;
        console.log(`   ✅ Order created: ${orderId}`);
        console.log(`   💰 Total amount: $${totalAmount}`);
        console.log(`   📊 Initial status: ${orderResponse.data.status}\n`);

        // Step 2: Simulate Payment
        console.log('2️⃣  Creating payment...');
        const paymentResponse = await axios.post<PaymentResponse>(`${PAYMENT_SERVICE}/api/v1/payments`, {
            orderId,
            amount: totalAmount,
            currency: 'USD',
            paymentMethod: 'card',
        });

        const transactionId = paymentResponse.data.transactionId;
        console.log(`   ✅ Payment initiated: ${transactionId}\n`);

        // Step 3: Wait for async payment processing
        console.log('3️⃣  Waiting for payment processing...');
        await sleep(2000); // Wait 2 seconds for async processing

        // Step 4: Verify Order Status
        console.log('4️⃣  Verifying order status...');
        const orderCheckResponse = await axios.get<OrderResponse>(`${ORDER_SERVICE}/api/v1/orders/${orderId}`);

        const finalStatus = orderCheckResponse.data.status;
        console.log(`   📊 Final status: ${finalStatus}\n`);

        // Step 5: Assert
        if (finalStatus === 'paid') {
            console.log('✅ ACCEPTANCE TEST PASSED!');
            console.log('   Order flow completed successfully: PENDING → PAID\n');
            process.exit(0);
        } else {
            console.log('❌ ACCEPTANCE TEST FAILED!');
            console.log(`   Expected status: paid`);
            console.log(`   Actual status: ${finalStatus}\n`);
            process.exit(1);
        }

    } catch (error: any) {
        console.log('❌ ACCEPTANCE TEST FAILED!');
        if (error.response) {
            console.log(`   HTTP ${error.response.status}: ${error.response.statusText}`);
            console.log(`   ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(`   ${error.message}`);
        }
        console.log('\n💡 Make sure all services are running:');
        console.log('   - Order Service (port 3000)');
        console.log('   - Payment Service (port 3001)');
        console.log('   - MongoDB (port 27017)');
        console.log('   - Kafka (port 9092)\n');
        process.exit(1);
    }
}

runAcceptanceTest();
