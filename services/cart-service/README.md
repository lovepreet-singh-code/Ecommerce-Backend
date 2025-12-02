# Cart Service

A fast, Redis-backed shopping cart microservice with JWT authentication and TTL-based cart expiration.

## Features

- ✅ Redis primary storage for high performance
- ✅ Per-user cart isolation with `cart:{userId}` key pattern
- ✅ Configurable TTL for automatic cart expiration
- ✅ JWT-based authentication
- ✅ RESTful API endpoints
- ✅ Atomic operations per user
- ✅ Request validation with Zod
- ✅ Comprehensive integration tests
- ✅ Docker support

## Prerequisites

- Node.js 18+
- Redis server
- JWT secret (shared with user-service)

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=4002
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
CART_TTL_SECONDS=604800
```

- **PORT**: Service port (default: 4002)
- **REDIS_URL**: Redis connection URL
- **JWT_SECRET**: Secret key for JWT verification (must match user-service)
- **CART_TTL_SECONDS**: Cart expiration time in seconds (default: 604800 = 7 days)

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
# Start Redis (if not running)
docker run -d -p 6379:6379 redis:alpine

# Start service in watch mode
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Get Cart

**GET** `/api/v1/cart`

Returns the current user's cart.

**Response:**
```json
{
  "userId": "user-123",
  "items": [
    {
      "productId": "prod-456",
      "qty": 2,
      "priceSnapshot": 99.99
    }
  ],
  "updatedAt": "2024-12-02T15:30:00.000Z"
}
```

### Add or Update Item

**POST** `/api/v1/cart`

Adds a new item or updates quantity if item already exists.

**Request Body:**
```json
{
  "productId": "prod-456",
  "qty": 2,
  "priceSnapshot": 99.99
}
```

**Response:** Returns updated cart

### Update Item Quantity

**PATCH** `/api/v1/cart`

Updates the quantity of an existing item.

**Request Body:**
```json
{
  "productId": "prod-456",
  "qty": 5
}
```

**Response:** Returns updated cart

### Remove Item

**DELETE** `/api/v1/cart/:productId`

Removes an item from the cart.

**Response:** Returns updated cart

### Clear Cart

**DELETE** `/api/v1/cart`

Removes all items from the cart.

**Response:** 204 No Content

## Example Workflow

```bash
# 1. Get JWT token from user-service
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Add item to cart
curl -X POST http://localhost:4002/api/v1/cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-123",
    "qty": 2,
    "priceSnapshot": 29.99
  }'

# 3. Fetch cart
curl http://localhost:4002/api/v1/cart \
  -H "Authorization: Bearer $TOKEN"

# 4. Update quantity
curl -X PATCH http://localhost:4002/api/v1/cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-123",
    "qty": 5
  }'

# 5. Remove item
curl -X DELETE http://localhost:4002/api/v1/cart/prod-123 \
  -H "Authorization: Bearer $TOKEN"
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

The test suite uses `ioredis-mock` to simulate Redis operations without requiring a running Redis instance.

## Docker

### Build Image

```bash
docker build -t cart-service .
```

### Run Container

```bash
docker run -d \
  -p 4002:4002 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e JWT_SECRET=your-secret \
  -e CART_TTL_SECONDS=604800 \
  cart-service
```

### Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  cart-service:
    build: .
    ports:
      - "4002:4002"
    environment:
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
      - CART_TTL_SECONDS=604800
    depends_on:
      - redis
```

## Architecture

### Storage Pattern

- **Key**: `cart:{userId}` (e.g., `cart:user-123`)
- **Value**: JSON string containing cart data
- **TTL**: Configurable via `CART_TTL_SECONDS` env variable

### Data Structure

```typescript
{
  userId: string;
  items: [
    {
      productId: string;
      qty: number;
      priceSnapshot?: number;
    }
  ];
  updatedAt: string; // ISO 8601 timestamp
}
```

### Atomic Operations

All cart operations are atomic per user:
- Each Redis operation (GET/SET/DEL) is atomic
- Cart modifications update the entire cart object
- TTL is reset on every write operation

## Health Check

**GET** `/health`

Returns service status.

**Response:**
```json
{
  "status": "UP",
  "service": "cart-service"
}
```

## Error Handling

The service uses standardized error responses:

- **400 Bad Request**: Invalid request body
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: Item not found in cart
- **500 Internal Server Error**: Server error

## Logging

The service uses the `@ecommerce-backend/common` logger for structured logging with Winston.

## License

ISC
