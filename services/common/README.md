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
