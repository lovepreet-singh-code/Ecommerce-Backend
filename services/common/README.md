# @ecommerce-backend/common

Shared utilities for the Ecommerce Backend microservices.

## Installation

```bash
npm install @ecommerce-backend/common
```

## Usage

### Logger

```typescript
import { logger } from '@ecommerce-backend/common';

logger.info('Hello world');
logger.error('Something went wrong');
```

### Environment Variables

```typescript
import { loadEnv } from '@ecommerce-backend/common';

loadEnv(['MONGO_URI', 'KAFKA_BROKERS']);
```

### Kafka

The common module provides production-ready Kafka utilities with retry logic, structured logging, and type-safe event envelopes.

#### Producer

```typescript
import { createProducer, createEvent, ProductUpdatedPayload } from '@ecommerce-backend/common';

// Initialize producer
const producer = await createProducer(
  process.env.KAFKA_BROKERS!.split(','),
  'product-service'
);

// Create a type-safe event
const event = createEvent<ProductUpdatedPayload>(
  'product.updated',
  {
    productId: 'prod_123',
    changes: [
      { field: 'price', oldValue: 999.99, newValue: 899.99 },
      { field: 'stock', oldValue: 50, newValue: 48 }
    ],
    updatedBy: 'admin_001',
    updatedAt: new Date().toISOString()
  },
  'update-flow-xyz' // optional correlationId
);

// Send message with automatic retry
await producer.send('product.updated', [
  {
    key: event.data.productId, // for partitioning
    value: JSON.stringify(event)
  }
]);

// Cleanup on shutdown
await producer.disconnect();
```

#### Consumer

```typescript
import { createConsumer, PaymentSuccessEvent } from '@ecommerce-backend/common';

// Initialize consumer
const consumer = await createConsumer(
  process.env.KAFKA_BROKERS!.split(','),
  'order-service',
  'order-service-group'
);

// Subscribe to topic with handler
await consumer.subscribe(
  'payment.success',
  async (message: PaymentSuccessEvent) => {
    console.log('Payment received:', message.data.paymentId);
    
    // Update order status
    await updateOrderStatus(message.data.orderId, 'paid');
    
    // Use correlationId for tracing
    if (message.correlationId) {
      console.log('Flow ID:', message.correlationId);
    }
  },
  true // autoCommit (default)
);

// Consumer runs continuously until disconnected
// Cleanup on shutdown
await consumer.disconnect();
```

#### Event Envelope Helper

```typescript
import { createEvent, OrderCreatedPayload } from '@ecommerce-backend/common';

// Helper automatically adds eventId, timestamp, and version
const event = createEvent<OrderCreatedPayload>(
  'order.created',
  {
    orderId: 'ord_123',
    userId: 'usr_456',
    items: [
      { productId: 'prod_001', quantity: 2, price: 999.99 }
    ],
    totalAmount: 1999.98,
    status: 'pending',
    createdAt: new Date().toISOString()
  },
  'checkout-flow-abc' // optional correlationId
);

console.log(event);
// {
//   eventId: "1733063456789-abc123def",
//   eventType: "order.created",
//   timestamp: "2025-12-01T14:50:56.789Z",
//   correlationId: "checkout-flow-abc",
//   version: "1.0",
//   data: { ... }
// }
```

#### Available Event Types

```typescript
import {
  OrderCreatedEvent,
  InventoryReservedEvent,
  InventoryFailedEvent,
  PaymentSuccessEvent,
  PaymentFailedEvent,
  ProductUpdatedEvent,
  NotificationEnqueueEvent,
} from '@ecommerce-backend/common';
```

#### Error Handling

The producer automatically retries with exponential backoff:

```typescript
try {
  // Retries up to 5 times by default
  await producer.send('product.updated', messages);
} catch (error) {
  logger.error('Failed to send message after retries:', error);
  // Handle failure (e.g., save to database, alert admin)
}
```

The consumer automatically handles reconnection and continues processing:

```typescript
await consumer.subscribe('payment.success', async (message) => {
  try {
    await processPayment(message);
  } catch (error) {
    // Error logged, consumer continues processing other messages
    logger.error('Failed to process payment:', error);
    // Optionally: send to dead letter queue
  }
});
```

### Legacy Kafka Wrapper (Backward Compatibility)

The old `KafkaWrapper` class is still available for backward compatibility:

```typescript
import { KafkaWrapper } from '@ecommerce-backend/common';

// Producer
const producer = await KafkaWrapper.createProducer('my-service', ['localhost:9092']);
await producer.send({
  topic: 'my-topic',
  messages: [{ value: 'hello' }],
});

// Consumer
const consumer = await KafkaWrapper.createConsumer('my-service', ['localhost:9092'], 'my-group');
await consumer.subscribe({ topic: 'my-topic' });
await consumer.run({
  eachMessage: async ({ message }) => {
    console.log(message.value?.toString());
  },
});
```

## Documentation

- **[TOPICS.md](./TOPICS.md)** - Complete reference for all Kafka topics, schemas, and examples

## Environment Variables

Required environment variables:

```bash
# Kafka Configuration
KAFKA_BROKERS=localhost:9092  # Comma-separated broker list
KAFKA_CLIENT_ID=my-service    # Unique client identifier
KAFKA_GROUP_ID=my-group       # Consumer group (for consumers only)
```

