# Inventory Service

An event-driven inventory management service that consumes `order.created` events, atomically reserves stock using MongoDB transactions, and publishes success/failure events to Kafka with built-in idempotency.

## Features

- ✅ Event-driven architecture with Kafka
- ✅ Atomic inventory reservations using MongoDB transactions
- ✅ Idempotency via orderId deduplication
- ✅ Multi-product reservation support
- ✅ Automatic rollback on insufficient stock
- ✅ REST API for inventory queries
- ✅ Comprehensive integration tests
- ✅ Docker support

## Prerequisites

- Node.js 18+
- MongoDB (with replica set for transactions)
- Kafka broker
- Running `order-service` to publish `order.created` events

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=4003
MONGO_URI=mongodb://localhost:27017/inventory-service
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=inventory-service
KAFKA_GROUP_ID=inventory-service-group
```

**Important**: MongoDB must be running as a replica set to support transactions. For local development:

```bash
# Start MongoDB as a replica set
docker run -d -p 27017:27017 --name mongo mongo --replSet rs0
docker exec -it mongo mongosh --eval "rs.initiate()"
```

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Running Locally

### Development Mode

```bash
# Start dependencies (MongoDB + Kafka)
# See docker-compose.yml in project root

# Start service in watch mode
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## Event Flow

### Input: `order.created`

The service subscribes to `order.created` events from Kafka.

**Event Structure:**
```json
{
  "eventId": "evt-123",
  "eventType": "order.created",
  "data": {
    "orderId": "ord-456",
    "userId": "user-789",
    "items": [
      {
        "productId": "prod-001",
        "quantity": 2,
        "price": 99.99
      }
    ],
    "totalAmount": 199.98,
    "status": "pending",
    "createdAt": "2024-12-02T15:30:00.000Z"
  },
  "timestamp": "2024-12-02T15:30:00.000Z",
  "correlationId": "checkout-flow-123",
  "version": "1.0"
}
```

### Processing Flow

1. **Idempotency Check**: Check if `orderId` already processed
2. **Stock Validation**: Verify all products have sufficient stock
3. **Atomic Reservation**: Use MongoDB transaction to:
   - Decrement `available` quantity
   - Increment `reserved` quantity
   - For ALL products or NONE (atomic)
4. **Event Publishing**:
   - Success → `inventory.reserved` event
   - Failure → `inventory.failed` event
5. **Mark Processed**: Store `orderId` to prevent re-processing

### Output: `inventory.reserved` (Success)

```json
{
  "eventId": "evt-789",
  "eventType": "inventory.reserved",
  "data": {
    "orderId": "ord-456",
    "reservationId": "res-123",
    "items": [
      {
        "productId": "prod-001",
        "quantity": 2
      }
    ],
    "reservedAt": "2024-12-02T15:30:01.000Z"
  },
  "correlationId": "checkout-flow-123",
  "version": "1.0"
}
```

### Output: `inventory.failed` (Insufficient Stock)

```json
{
  "eventId": "evt-790",
  "eventType": "inventory.failed",
  "data": {
    "orderId": "ord-456",
    "items": [
      {
        "productId": "prod-001",
        "requestedQuantity": 10,
        "availableQuantity": 2
      }
    ],
    "reason": "Insufficient stock: prod-001: requested 10, available 2",
    "failedAt": "2024-12-02T15:30:01.000Z"
  },
  "correlationId": "checkout-flow-123",
  "version": "1.0"
}
```

## REST API Endpoints

### Get Inventory Status

**GET** `/api/v1/inventory/:productId`

Returns current stock levels for a product.

**Response:**
```json
{
  "productId": "prod-001",
  "available": 25,
  "reserved": 5,
  "total": 30
}
```

### Create/Update Stock (Admin)

**POST** `/api/v1/inventory`

Seeds or updates stock for a product.

**Request Body:**
```json
{
  "productId": "prod-001",
  "available": 100
}
```

**Response:** Returns updated inventory status

## Data Models

### Stock Collection

```typescript
{
  productId: string;      // unique
  available: number;      // available quantity
  reserved: number;       // reserved quantity
  updatedAt: Date;
  createdAt: Date;
}
```

### ProcessedOrder Collection

```typescript
{
  orderId: string;        // unique (idempotency key)
  status: 'reserved' | 'failed';
  reservationId?: string;
  items: Array<{ productId, quantity }>;
  reason?: string;
  processedAt: Date;
}
```

## Atomic Operations

The service uses **MongoDB transactions** to ensure atomicity:

```typescript
// Pseudo-code
START TRANSACTION
  FOR EACH item IN order.items:
    CHECK stock.available >= item.quantity
  
  IF ALL checks pass:
    FOR EACH item:
      UPDATE Stock SET
        available = available - item.quantity,
        reserved = reserved + item.quantity
    COMMIT
  ELSE:
    ROLLBACK
```

This guarantees:
- ✅ All-or-nothing reservation
- ✅ No partial reservations
- ✅ No race conditions

## Idempotency

The service prevents duplicate processing of the same order:

1. Before processing, check `ProcessedOrder` collection for `orderId`
2. If found, skip processing (log and return)
3. If not found, process and mark as completed

This ensures:
- ✅ Kafka consumer restarts don't cause double-booking
- ✅ Retry logic is safe
- ✅ Exactly-once semantics

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

The test suite uses **MongoDB Memory Server** and **mocked Kafka** to test:
- ✅ Stock creation and queries
- ✅ Atomic reservations (success and failure)
- ✅ Transaction rollback on partial failure
- ✅ Idempotency checks
- ✅ Event handler logic
- ✅ REST API endpoints

## Docker

### Build Image

```bash
docker build -t inventory-service .
```

### Run Container

```bash
docker run -d \
  -p 4003:4003 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/inventory-service \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  inventory-service
```

## Health Check

**GET** `/health`

Returns service status.

**Response:**
```json
{
  "status": "UP",
  "service": "inventory-service"
}
```

## Error Handling

The service handles various error scenarios:

- **Insufficient Stock**: Publishes `inventory.failed` with details
- **Non-existent Product**: Treated as unavailable (qty = 0)
- **Transaction Failure**: Automatic rollback, error logged
- **Kafka Failure**: Error logged, service continues (with retries)

## Logging

The service uses structured logging with Winston:

- `📥` Received events
- `📤` Published events
- `✅` Successful operations
- `⚠️` Warnings (insufficient stock)
- `❌` Errors

## Example Workflow

### 1. Seed Stock

```bash
curl -X POST http://localhost:4003/api/v1/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-001",
    "available": 50
  }'
```

### 2. Query Stock

```bash
curl http://localhost:4003/api/v1/inventory/prod-001
# Response: { "productId": "prod-001", "available": 50, "reserved": 0, "total": 50 }
```

### 3. Simulate Order (via Kafka)

Publish `order.created` event to Kafka:

```bash
# The order-service would naturally publish this
# For testing, you can use kafka-console-producer
```

### 4. Verify Reservation

```bash
curl http://localhost:4003/api/v1/inventory/prod-001
# Response: { "productId": "prod-001", "available": 48, "reserved": 2, "total": 50 }
```

### 5. Check Events (Kafka Consumer)

Subscribe to `inventory.reserved` or `inventory.failed` topics to see emitted events.

## Architecture Diagram

```
┌─────────────────┐      order.created       ┌──────────────────────┐
│  Order Service  │─────────────────────────▶│   Kafka (Topic)      │
└─────────────────┘                          └──────────────────────┘
                                                       │
                                                       │ consume
                                                       ▼
                                             ┌──────────────────────┐
                                             │ Inventory Service    │
                                             │                      │
                                             │ 1. Check idempotency │
                                             │ 2. Validate stock    │
                                             │ 3. Reserve (atomic)  │
                                             │ 4. Publish event     │
                                             │ 5. Mark processed    │
                                             └──────────────────────┘
                                                       │
                                         ┌─────────────┴──────────────┐
                                         │                            │
                                         ▼                            ▼
                               inventory.reserved          inventory.failed
                                  (success)                  (failure)
```

## Acceptance Criteria

✅ **Atomic reservation**: MongoDB transactions ensure all-or-nothing  
✅ **Event-driven**: Consumes `order.created`, emits `inventory.reserved/failed`  
✅ **Idempotency**: Prevents duplicate processing using `orderId`  
✅ **REST API**: GET endpoint for inventory queries  
✅ **Tests**: Integration tests with event simulation  
✅ **Dedupe**: Re-processing same orderId is safely skipped

## License

ISC
