# Kafka Topics Documentation

This document defines all Kafka topics used in the ecommerce backend microservices architecture.

## Topic Naming Convention

Topics follow the format: `<domain>.<event>` (e.g., `order.created`, `payment.success`)

## Topic Definitions

### 1. `order.created`

**Description**: Published when a new order is created

**Producer**: Order Service  
**Consumers**: Inventory Service, Notification Service

**Message Schema**:
```typescript
{
  eventId: string;
  eventType: "order.created";
  timestamp: string; // ISO 8601
  correlationId?: string;
  version: "1.0";
  data: {
    orderId: string;
    userId: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    status: "pending" | "confirmed" | "cancelled";
    createdAt: string;
  }
}
```

**Example Message**:
```json
{
  "eventId": "1733063456789-abc123def",
  "eventType": "order.created",
  "timestamp": "2025-12-01T14:50:56.789Z",
  "correlationId": "order-flow-xyz789",
  "version": "1.0",
  "data": {
    "orderId": "ord_123456",
    "userId": "usr_789",
    "items": [
      {
        "productId": "prod_001",
        "quantity": 2,
        "price": 999.99
      },
      {
        "productId": "prod_002",
        "quantity": 1,
        "price": 499.99
      }
    ],
    "totalAmount": 2499.97,
    "status": "pending",
    "createdAt": "2025-12-01T14:50:56.789Z"
  }
}
```

---

### 2. `inventory.reserved`

**Description**: Published when inventory is successfully reserved for an order

**Producer**: Inventory Service  
**Consumers**: Order Service, Notification Service

**Message Schema**:
```typescript
{
  eventId: string;
  eventType: "inventory.reserved";
  timestamp: string;
  correlationId?: string;
  version: "1.0";
  data: {
    orderId: string;
    reservationId: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
    reservedAt: string;
  }
}
```

**Example Message**:
```json
{
  "eventId": "1733063460123-xyz456abc",
  "eventType": "inventory.reserved",
  "timestamp": "2025-12-01T14:51:00.123Z",
  "correlationId": "order-flow-xyz789",
  "version": "1.0",
  "data": {
    "orderId": "ord_123456",
    "reservationId": "res_789012",
    "items": [
      {
        "productId": "prod_001",
        "quantity": 2
      },
      {
        "productId": "prod_002",
        "quantity": 1
      }
    ],
    "reservedAt": "2025-12-01T14:51:00.123Z"
  }
}
```

---

### 3. `inventory.failed`

**Description**: Published when inventory reservation fails (insufficient stock)

**Producer**: Inventory Service  
**Consumers**: Order Service, Notification Service

**Message Schema**:
```typescript
{
  eventId: string;
  eventType: "inventory.failed";
  timestamp: string;
  correlationId?: string;
  version: "1.0";
  data: {
    orderId: string;
    items: Array<{
      productId: string;
      requestedQuantity: number;
      availableQuantity: number;
    }>;
    reason: string;
    failedAt: string;
  }
}
```

**Example Message**:
```json
{
  "eventId": "1733063465456-def789ghi",
  "eventType": "inventory.failed",
  "timestamp": "2025-12-01T14:51:05.456Z",
  "correlationId": "order-flow-xyz789",
  "version": "1.0",
  "data": {
    "orderId": "ord_123456",
    "items": [
      {
        "productId": "prod_001",
        "requestedQuantity": 2,
        "availableQuantity": 0
      }
    ],
    "reason": "Insufficient stock for product prod_001",
    "failedAt": "2025-12-01T14:51:05.456Z"
  }
}
```

---

### 4. `payment.success`

**Description**: Published when payment is successfully processed

**Producer**: Payment Service  
**Consumers**: Order Service, Notification Service

**Message Schema**:
```typescript
{
  eventId: string;
  eventType: "payment.success";
  timestamp: string;
  correlationId?: string;
  version: "1.0";
  data: {
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
    paymentMethod: "card" | "upi" | "wallet" | "netbanking";
    transactionId: string;
    paidAt: string;
  }
}
```

**Example Message**:
```json
{
  "eventId": "1733063470789-jkl012mno",
  "eventType": "payment.success",
  "timestamp": "2025-12-01T14:51:10.789Z",
  "correlationId": "order-flow-xyz789",
  "version": "1.0",
  "data": {
    "orderId": "ord_123456",
    "paymentId": "pay_345678",
    "amount": 2499.97,
    "currency": "INR",
    "paymentMethod": "upi",
    "transactionId": "txn_901234567890",
    "paidAt": "2025-12-01T14:51:10.789Z"
  }
}
```

---

### 5. `payment.failed`

**Description**: Published when payment processing fails

**Producer**: Payment Service  
**Consumers**: Order Service, Notification Service

**Message Schema**:
```typescript
{
  eventId: string;
  eventType: "payment.failed";
  timestamp: string;
  correlationId?: string;
  version: "1.0";
  data: {
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
    reason: string;
    errorCode?: string;
    failedAt: string;
  }
}
```

**Example Message**:
```json
{
  "eventId": "1733063475012-pqr345stu",
  "eventType": "payment.failed",
  "timestamp": "2025-12-01T14:51:15.012Z",
  "correlationId": "order-flow-xyz789",
  "version": "1.0",
  "data": {
    "orderId": "ord_123456",
    "paymentId": "pay_345678",
    "amount": 2499.97,
    "currency": "INR",
    "reason": "Insufficient funds",
    "errorCode": "INSUFFICIENT_FUNDS",
    "failedAt": "2025-12-01T14:51:15.012Z"
  }
}
```

---

### 6. `product.updated`

**Description**: Published when product details are updated

**Producer**: Product Service  
**Consumers**: Search Service, Cache Invalidation Service

**Message Schema**:
```typescript
{
  eventId: string;
  eventType: "product.updated";
  timestamp: string;
  correlationId?: string;
  version: "1.0";
  data: {
    productId: string;
    changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
    updatedBy: string;
    updatedAt: string;
  }
}
```

**Example Message**:
```json
{
  "eventId": "1733063480345-vwx678yza",
  "eventType": "product.updated",
  "timestamp": "2025-12-01T14:51:20.345Z",
  "version": "1.0",
  "data": {
    "productId": "prod_001",
    "changes": [
      {
        "field": "price",
        "oldValue": 999.99,
        "newValue": 899.99
      },
      {
        "field": "stock",
        "oldValue": 50,
        "newValue": 48
      }
    ],
    "updatedBy": "usr_admin_001",
    "updatedAt": "2025-12-01T14:51:20.345Z"
  }
}
```

---

### 7. `notification.enqueue`

**Description**: Published to queue notifications for delivery

**Producer**: Any Service  
**Consumers**: Notification Service

**Message Schema**:
```typescript
{
  eventId: string;
  eventType: "notification.enqueue";
  timestamp: string;
  correlationId?: string;
  version: "1.0";
  data: {
    notificationId: string;
    userId: string;
    type: "email" | "sms" | "push";
    channel: string;
    subject?: string;
    message: string;
    metadata?: Record<string, any>;
    priority: "low" | "normal" | "high";
    scheduledAt?: string;
  }
}
```

**Example Message**:
```json
{
  "eventId": "1733063485678-bcd901efg",
  "eventType": "notification.enqueue",
  "timestamp": "2025-12-01T14:51:25.678Z",
  "correlationId": "order-flow-xyz789",
  "version": "1.0",
  "data": {
    "notificationId": "notif_567890",
    "userId": "usr_789",
    "type": "email",
    "channel": "order-confirmation",
    "subject": "Order Confirmed - #ord_123456",
    "message": "Your order has been confirmed and is being processed.",
    "metadata": {
      "orderId": "ord_123456",
      "orderTotal": 2499.97
    },
    "priority": "high"
  }
}
```

---

## Best Practices

### 1. **Use Correlation IDs**
Always include a `correlationId` to track related events across services. This helps with debugging and observability.

### 2. **Event Versioning**
Include a `version` field to support schema evolution and backward compatibility.

### 3. **Idempotency**
Consumers should be idempotent. Use `eventId` to detect and handle duplicate messages.

### 4. **Error Handling**
- Producers: Retry failed sends with exponential backoff
- Consumers: Log errors but don't crash; use dead letter queues for poison messages

### 5. **Message Size**
Keep messages under 1MB. Use references (IDs) instead of embedding large payloads.

### 6. **Ordering**
Use message keys (partition keys) when ordering matters. Events for the same order should use `orderId` as the key.

### 7. **Retention**
Configure appropriate retention policies based on use case:
- Transactional events: 7-30 days
- Audit logs: 90+ days

## Configuration

### Environment Variables

```bash
# Kafka broker addresses (comma-separated)
KAFKA_BROKERS=localhost:9092,localhost:9093,localhost:9094

# Service-specific client ID
KAFKA_CLIENT_ID=product-service

# Consumer group ID (for consumers)
KAFKA_GROUP_ID=product-service-group
```

### Topic Configuration

All topics should be created with:
- **Partitions**: 3 (for parallelism)
- **Replication Factor**: 3 (for fault tolerance)
- **Cleanup Policy**: delete (log retention)
- **Retention**: 7 days (604800000 ms)

```bash
# Example: Create topic
kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic order.created \
  --partitions 3 \
  --replication-factor 3 \
  --config retention.ms=604800000
```
