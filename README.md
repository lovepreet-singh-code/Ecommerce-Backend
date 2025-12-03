# E-Commerce Backend - Microservices Platform

Event-driven microservices architecture for e-commerce with Kafka, MongoDB, and TypeScript.

## 🏗️ Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Order     │  │  Payment    │  │Notification │  │   Review    │
│  Service    │  │  Service    │  │  Service    │  │  Service    │
│  (3000)     │  │  (3001)     │  │  (3002)     │  │  (3003)     │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                        │
                   ┌────▼────┐
                   │  Kafka  │
                   └────┬────┘
                        │
       ┌────────────────┴────────────────┬────────────────┐
       │                                 │                │
┌──────▼──────┐                   ┌──────▼──────┐  ┌─────▼──────┐
│ Inventory   │                   │   Search    │  │  MongoDB   │
│  Service    │                   │  Service    │  │            │
│  (3000)     │                   │  (3004)     │  │            │
└─────────────┘                   └─────────────┘  └────────────┘
```

## 📦 Services

| Service | Port | Description |
|---------|------|-------------|
| **Inventory** | 3000 | Stock management & reservations |
| **Order** | 3000 | Order lifecycle management |
| **Payment** | 3001 | Payment simulation & webhooks |
| **Notification** | 3002 | Event-driven notifications |
| **Review** | 3003 | Product reviews & ratings |
| **Search** | 3004 | Product search (MeiliSearch/MongoDB) |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 5+
- Kafka 3+ (with Zookeeper)
- (Optional) MeiliSearch for advanced search

### 1. Start Infrastructure

```bash
# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Kafka + Zookeeper
docker-compose up -d kafka zookeeper
# OR use Confluent Platform, Redpanda, etc.
```

### 2. Install Dependencies

```bash
# Install common library first
cd services/common
npm install
npm run build

# Install all services
cd ../inventory-service && npm install
cd ../order-service && npm install
cd ../payment-service && npm install
cd ../notification-service && npm install
cd ../review-service && npm install
cd ../search-service && npm install
```

### 3. Configure Environment

Create `.env` files in each service directory:

```env
# Common for all services
MONGO_URI=mongodb://localhost:27017/{service-name}
KAFKA_BROKERS=localhost:9092
NODE_ENV=development
```

**Service-specific ports:**
- Inventory: `PORT=3000`
- Order: `PORT=3000`
- Payment: `PORT=3001`
- Notification: `PORT=3002`
- Review: `PORT=3003`
- Search: `PORT=3004`

### 4. Seed Data (Optional)

```bash
cd scripts
npm install
MONGO_URI=mongodb://localhost:27017 npx ts-node seed-data.ts
```

### 5. Run Services

```bash
# Terminal 1 - Inventory
cd services/inventory-service
npm run dev

# Terminal 2 - Order
cd services/order-service
npm run dev

# Terminal 3 - Payment
cd services/payment-service
npm run dev

# Terminal 4 - Notification
cd services/notification-service
npm run dev

# Terminal 5 - Review
cd services/review-service
npm run dev

# Terminal 6 - Search
cd services/search-service
npm run dev
```

## 🧪 Testing

### Run Unit Tests

```bash
# Test a specific service
cd services/order-service
npm test

# Test all services
for dir in services/*/; do
  cd "$dir"
  npm test
  cd ../..
done
```

### Run Acceptance Test

```bash
# Make sure Order and Payment services are running
cd scripts
npm install axios
npx ts-node acceptance-test.ts
```

**Expected Output:**
```
🧪 Starting Acceptance Test

1️⃣  Creating order...
   ✅ Order created: order-xxx
   💰 Total amount: $40
   📊 Initial status: pending

2️⃣  Creating payment...
   ✅ Payment initiated: txn-xxx

3️⃣  Waiting for payment processing...
4️⃣  Verifying order status...
   📊 Final status: paid

✅ ACCEPTANCE TEST PASSED!
```

## 📝 API Documentation

### OpenAPI Specification

View the complete API spec: [`api-spec.yaml`](./api-spec.yaml)

### Postman Collection

Import [`postman-collection.json`](./postman-collection.json) into Postman.

**Collection Variables:**
- `order_service_url`: http://localhost:3000
- `payment_service_url`: http://localhost:3001
- `notification_service_url`: http://localhost:3002
- `review_service_url`: http://localhost:3003
- `search_service_url`: http://localhost:3004

## 🔍 Verification Checklist

### 1. Create Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "prod-123", "quantity": 2, "price": 20}
    ]
  }'
```

**Expected:** Status 201, returns order with `id` and `status: "pending"`

**Save the `id` from response for next steps!**

### 2. Get Order

```bash
curl http://localhost:3000/api/v1/orders/{ORDER_ID}
```

**Expected:** Order details with current status

### 3. Create Payment

```bash
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "{ORDER_ID}",
    "amount": 40,
    "currency": "USD",
    "paymentMethod": "card"
  }'
```

**Expected:** Status 201, returns payment with `transactionId`

### 4. Verify Order Status (after 2 seconds)

```bash
curl http://localhost:3000/api/v1/orders/{ORDER_ID}
```

**Expected:** `status: "paid"`

### 5. Check Notifications

```bash
curl http://localhost:3002/api/v1/notifications/user/user-id-placeholder
```

**Expected:** Notifications for order creation and payment success

### 6. Create Review

```bash
curl -X POST http://localhost:3003/api/v1/reviews \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-123" \
  -d '{
    "productId": "prod-123",
    "rating": 5,
    "comment": "Great product!"
  }'
```

**Expected:** Status 201, review created

### 7. Get Reviews

```bash
curl http://localhost:3003/api/v1/reviews/product/prod-123
```

**Expected:** Reviews list with average rating

### 8. Search Products

```bash
curl "http://localhost:3004/api/v1/search?q=laptop&limit=10"
```

**Expected:** Search results (requires seeded data or product events)

## 🐛 Debugging Tips

### Service Won't Start

1. **Check MongoDB connection:**
   ```bash
   mongosh mongodb://localhost:27017
   ```

2. **Check Kafka:**
   ```bash
   # List topics
   kafka-topics.sh --bootstrap-server localhost:9092 --list
   ```

3. **Check ports:**
   ```bash
   netstat -an | grep LISTEN | grep "3000\|3001\|3002\|3003\|3004"
   ```

### Events Not Processing

1. **Check Kafka consumer groups:**
   ```bash
   kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
   ```

2. **View service logs** - look for Kafka connection messages

3. **Verify topic creation:**
   ```bash
   kafka-topics.sh --bootstrap-server localhost:9092 --describe
   ```

### Payment Not Updating Order

1. **Check payment service logs** for event publishing
2. **Check order service logs** for event consumption
3. **Verify Kafka topic:** `payment.success`
4. **Check order status** directly in MongoDB:
   ```bash
   mongosh mongodb://localhost:27017/order-service
   db.orders.find()
   ```

## 🌍 Environment Variables

### Common Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/{service}` |
| `KAFKA_BROKERS` | Kafka broker addresses | `localhost:9092` |
| `NODE_ENV` | Environment | `development` |
| `PORT` | Service port | Service-specific |

### Search Service Specific

| Variable | Description | Default |
|----------|-------------|---------|
| `SEARCH_PROVIDER` | Search adapter | `mongodb` |
| `MEILISEARCH_HOST` | MeiliSearch URL | `http://localhost:7700` |
| `MEILISEARCH_API_KEY` | MeiliSearch API key | - |

## 🔄 CI/CD

GitHub Actions workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

**Runs on:** Push to `main` or `develop`, Pull Requests

**Steps:**
1. Install dependencies
2. Lint (if configured)
3. Run tests
4. Build TypeScript
5. Build Docker images (no push)

## 📚 Additional Resources

- **Service READMEs:** Each service has detailed documentation
- **Simulation Guides:** See `SIMULATION.md` in order-service
- **Event Types:** Defined in `services/common/src/types/`

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Submit PR

## 📄 License

MIT
