# Notification Service

Event-driven notification service that consumes order and payment events to create user notifications.

## Features

- **Event Consumers**: Listens to `order.created`, `payment.success`, and `payment.failed` events
- **Notification Storage**: MongoDB-based notification persistence
- **REST API**: Retrieve user notifications with pagination and filtering
- **Auto-generated**: Notifications are automatically created from Kafka events

## API Endpoints

### Get User Notifications

```bash
GET /api/v1/notifications/user/:userId
```

**Query Parameters:**
- `limit` (optional, default: 20) - Number of notifications to return
- `skip` (optional, default: 0) - Number of notifications to skip
- `unreadOnly` (optional, default: false) - Filter for unread notifications only

**Example:**
```bash
curl http://localhost:3002/api/v1/notifications/user/user-123?limit=10&unreadOnly=true
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "notification-id",
      "userId": "user-123",
      "type": "order_created",
      "title": "Order Placed Successfully",
      "message": "Your order #order-456 for $100 has been placed successfully.",
      "read": false,
      "metadata": {
        "orderId": "order-456",
        "amount": 100
      },
      "createdAt": "2025-12-03T...",
      "updatedAt": "2025-12-03T..."
    }
  ],
  "total": 5,
  "limit": 10,
  "skip": 0
}
```

## Notification Types

### 1. Order Created
**Event:** `order.created`  
**Title:** "Order Placed Successfully"  
**Message:** "Your order #{orderId} for ${amount} has been placed successfully."

### 2. Payment Success
**Event:** `payment.success`  
**Title:** "Payment Successful"  
**Message:** "Your payment of ${amount} via {paymentMethod} was successful for order #{orderId}."

### 3. Payment Failed
**Event:** `payment.failed`  
**Title:** "Payment Failed"  
**Message:** "Your payment of ${amount} failed for order #{orderId}. Reason: {reason}"

## Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/notification-service
KAFKA_BROKERS=localhost:9092
PORT=3002
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

## Testing

Example flow:

```bash
# 1. Create an order (triggers order.created event)
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"productId": "prod-123", "quantity": 2, "price": 20}]}'

# 2. Check notifications for user
curl http://localhost:3002/api/v1/notifications/user/user-id-placeholder

# 3. Create a payment (triggers payment.success or payment.failed)
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "amount": 40,
    "currency": "USD",
    "paymentMethod": "card"
  }'

# 4. Check notifications again
curl http://localhost:3002/api/v1/notifications/user/user-id-placeholder
```

## Architecture

- **Model**: `Notification` with userId index for fast queries
- **Consumers**: 
  - `order-created-consumer.ts`: Creates notification on order creation
  - `payment-success-consumer.ts`: Creates notification on successful payment
  - `payment-failed-consumer.ts`: Creates notification on failed payment
- **Routes**: `get-notifications.ts`: Retrieves user notifications with pagination

## Future Enhancements

- Mark notifications as read
- Delete notifications
- Real-time push notifications via WebSockets
- Email/SMS integration
- Notification preferences
- In-memory storage option (currently MongoDB only)
