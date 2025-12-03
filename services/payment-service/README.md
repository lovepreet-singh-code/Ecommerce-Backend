# Payment Service

Payment processing and simulation service for the ecommerce backend.

## Features

- **Payment Simulation**: Create payments with configurable success/failure and delay parameters
- **Webhook Handling**: Process payment webhooks with idempotency guarantees
- **Kafka Events**: Publish `payment.success` and `payment.failed` events
- **Idempotency**: Duplicate webhooks are detected and handled gracefully

## API Endpoints

### Create Payment

```bash
POST /api/v1/payments
```

**Request Body:**
```json
{
  "orderId": "order-123",
  "amount": 100,
  "currency": "USD",
  "paymentMethod": "card",
  "simulationParams": {
    "shouldFail": false,
    "delayMs": 1000
  }
}
```

**Payment Methods:** `card`, `upi`, `wallet`, `netbanking`

**Response:**
```json
{
  "id": "payment-id",
  "orderId": "order-123",
  "transactionId": "txn-xxx",
  "amount": 100,
  "currency": "USD",
  "paymentMethod": "card",
  "status": "pending",
  "createdAt": "2025-12-03T..."
}
```

### Webhook

```bash
POST /api/v1/payments/webhook
```

**Request Body:**
```json
{
  "transactionId": "txn-xxx",
  "status": "success"
}
```

**Status:** `success` or `failed`

**Response:**
```json
{
  "message": "Webhook processed",
  "duplicate": false
}
```

## Simulation Scenarios

### 1. Successful Payment (Immediate)

```bash
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "amount": 100,
    "currency": "USD",
    "paymentMethod": "card"
  }'
```

### 2. Failed Payment

```bash
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-456",
    "amount": 200,
    "currency": "USD",
    "paymentMethod": "upi",
    "simulationParams": {
      "shouldFail": true
    }
  }'
```

### 3. Delayed Payment (Race Condition Testing)

```bash
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-789",
    "amount": 50,
    "currency": "USD",
    "paymentMethod": "wallet",
    "simulationParams": {
      "delayMs": 5000
    }
  }'
```

### 4. Manual Webhook Trigger

```bash
curl -X POST http://localhost:3001/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn-xxx",
    "status": "success"
  }'
```

### 5. Test Idempotency (Duplicate Webhook)

```bash
# Send the same webhook twice
curl -X POST http://localhost:3001/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn-xxx",
    "status": "success"
  }'

# Second call returns duplicate: true
curl -X POST http://localhost:3001/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn-xxx",
    "status": "success"
  }'
```

## Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/payment-service
KAFKA_BROKERS=localhost:9092
PORT=3001
NODE_ENV=development
```

## Running the Service

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Kafka Events

### payment.success

Published when a payment succeeds.

```json
{
  "eventId": "...",
  "eventType": "payment.success",
  "data": {
    "orderId": "order-123",
    "paymentId": "payment-id",
    "amount": 100,
    "currency": "USD",
    "paymentMethod": "card",
    "transactionId": "txn-xxx",
    "paidAt": "2025-12-03T..."
  },
  "timestamp": "...",
  "correlationId": "order-123",
  "version": "1.0"
}
```

### payment.failed

Published when a payment fails.

```json
{
  "eventId": "...",
  "eventType": "payment.failed",
  "data": {
    "orderId": "order-123",
    "paymentId": "payment-id",
    "amount": 100,
    "currency": "USD",
    "reason": "Payment simulation failed",
    "errorCode": "SIMULATION_FAILURE",
    "failedAt": "2025-12-03T..."
  },
  "timestamp": "...",
  "correlationId": "order-123",
  "version": "1.0"
}
```

## Testing

The service includes comprehensive tests for:
- Payment creation with various parameters
- Webhook processing
- Idempotency verification
- Kafka event publishing

Run tests with:
```bash
npm test
```

## Architecture

- **Model**: `Payment` with idempotency tracking via `webhookProcessed` flag
- **Routes**: 
  - `create-payment.ts`: Handles payment creation
  - `webhook.ts`: Handles webhook callbacks
- **Service**: `payment-processor.ts`: Async payment processing and webhook handling
- **Kafka**: Event publishing for payment success/failure

## Idempotency

The service ensures idempotent webhook processing:
1. Each payment has a unique `transactionId`
2. Webhooks are marked as processed via `webhookProcessed` flag
3. Duplicate webhooks return success but don't republish events
4. Only one Kafka event is published per payment
