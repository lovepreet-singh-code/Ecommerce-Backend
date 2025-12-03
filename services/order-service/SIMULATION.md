# Order Service Simulation Scripts

## Prerequisites
- MongoDB running on `localhost:27017`
- Kafka running on `localhost:9092`
- Order service running (`npm run dev`)

## End-to-End Flow Simulation

### 1. Create an Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "prod-123",
        "quantity": 2,
        "price": 20
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "id": "<ORDER_ID>",
  "userId": "user-id-placeholder",
  "status": "pending",
  "items": [...],
  "totalAmount": 40,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Save the `id` from the response - you'll need it for the next steps!**

### 2. Simulate Inventory Reserved Event

```bash
npx ts-node src/scripts/simulate-events.ts inventory-reserved <ORDER_ID>
```

**Check order status:**
```bash
curl http://localhost:3000/api/v1/orders/<ORDER_ID>
```

**Expected:** `status` should be `"reserved"`

### 3. Simulate Payment Success Event

```bash
npx ts-node src/scripts/simulate-events.ts payment-success <ORDER_ID>
```

**Check order status:**
```bash
curl http://localhost:3000/api/v1/orders/<ORDER_ID>
```

**Expected:** `status` should be `"paid"`

## Alternative Flow: Inventory Failure

### 1. Create another order (follow step 1 above)

### 2. Simulate Inventory Failed Event

```bash
npx ts-node src/scripts/simulate-events.ts inventory-failed <ORDER_ID>
```

**Check order status:**
```bash
curl http://localhost:3000/api/v1/orders/<ORDER_ID>
```

**Expected:** `status` should be `"cancelled"`

## Update Order Status (Admin/Internal)

```bash
curl -X PATCH http://localhost:3000/api/v1/orders/<ORDER_ID>/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped"
  }'
```

## Idempotency Testing

Send the same event multiple times and verify the order status doesn't change incorrectly:

```bash
# Send inventory-reserved twice
npx ts-node src/scripts/simulate-events.ts inventory-reserved <ORDER_ID>
npx ts-node src/scripts/simulate-events.ts inventory-reserved <ORDER_ID>

# Check logs - should see "ignoring inventory reservation" message
```

## Monitoring Kafka Events

If you have `kafkacat` or `kcat` installed:

```bash
# Monitor order.created events
kcat -b localhost:9092 -t order.created -C

# Monitor inventory events
kcat -b localhost:9092 -t inventory.reserved -C
kcat -b localhost:9092 -t inventory.failed -C

# Monitor payment events
kcat -b localhost:9092 -t payment.success -C
```

## Expected Order Lifecycle

```
PENDING (order created)
   ↓
RESERVED (inventory reserved)
   ↓
PAID (payment success)
   ↓
SHIPPED (manual update)
   ↓
DELIVERED (manual update)
```

## Error Scenarios

1. **Inventory Failure**: PENDING → CANCELLED
2. **Payment after Cancellation**: Logs warning, no status change
3. **Duplicate Events**: Idempotency check prevents duplicate transitions
