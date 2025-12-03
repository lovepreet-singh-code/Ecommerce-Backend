# API Gateway

Central entry point for all microservices with authentication, rate limiting, and request routing.

## Features

- **Request Routing**: Proxies requests to appropriate microservices
- **Authentication**: JWT-based authentication middleware
- **Rate Limiting**: Protects services from abuse
- **CORS Handling**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security best practices
- **Logging**: Morgan for HTTP request logging
- **Health Checks**: Service health monitoring

## Architecture

```
Client → API Gateway (Port 8000) → Microservices
         ├─ Auth Middleware
         ├─ Rate Limiting
         └─ Proxy Routing
```

## API Routes

### Public Routes
- `GET /health` - Health check
- `GET /api/v1/gateway/info` - Gateway information
- `GET /api/v1/search` - Search products (no auth)
- `GET /api/v1/reviews/product/:productId` - Get reviews (no auth)

### Authenticated Routes
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order
- `POST /api/v1/payments` - Create payment (rate limited)
- `GET /api/v1/notifications/user/:userId` - Get notifications
- `POST /api/v1/reviews` - Create review

### Admin Routes
- `GET /api/v1/inventory/:productId` - Get inventory (admin only)

## Authentication

### JWT Token Format

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "role": "buyer|seller|admin"
}
```

### Using Authentication

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Example:**
```bash
curl http://localhost:8000/api/v1/orders \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"items": [...]}'
```

### Generating Test Tokens

For development, you can generate test tokens:

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    id: 'user-123',
    email: 'buyer@example.com',
    role: 'buyer'
  },
  'your-secret-key-change-in-production',
  { expiresIn: '24h' }
);

console.log(token);
```

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| General | 100 requests / 15 min |
| Authentication | 5 requests / 15 min |
| Payments | 10 requests / 1 min |

## Environment Variables

```env
# Server
PORT=8000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production

# Service URLs
INVENTORY_SERVICE_URL=http://localhost:3000
ORDER_SERVICE_URL=http://localhost:3000
PAYMENT_SERVICE_URL=http://localhost:3001
NOTIFICATION_SERVICE_URL=http://localhost:3002
REVIEW_SERVICE_URL=http://localhost:3003
SEARCH_SERVICE_URL=http://localhost:3004

# CORS
CORS_ORIGIN=*
```

## Running the Service

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Testing

### 1. Health Check

```bash
curl http://localhost:8000/health
```

**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-03T...",
  "uptime": 123.45,
  "service": "api-gateway"
}
```

### 2. Gateway Info

```bash
curl http://localhost:8000/api/v1/gateway/info
```

### 3. Create Order (with auth)

```bash
# First, generate a JWT token (see above)
export TOKEN="your-jwt-token"

curl -X POST http://localhost:8000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "prod-123", "quantity": 2, "price": 20}
    ]
  }'
```

### 4. Search Products (public)

```bash
curl "http://localhost:8000/api/v1/search?q=laptop"
```

## Request Flow

```
1. Client Request
   ↓
2. API Gateway receives request
   ↓
3. Rate Limiting Check
   ↓
4. Authentication Middleware (if required)
   ↓
5. Add user headers (x-user-id, x-user-role)
   ↓
6. Proxy to target microservice
   ↓
7. Return response to client
```

## Security Features

- **Helmet.js**: Sets security HTTP headers
- **CORS**: Configurable origin restrictions
- **Rate Limiting**: Prevents abuse
- **JWT Validation**: Secure token verification
- **Role-Based Access**: Admin/user/seller permissions

## Logging

All requests are logged with:
- HTTP method
- URL path
- Response status
- Response time
- IP address

## Error Handling

Standardized error responses:

```json
{
  "error": "Error message",
  "stack": "..." // only in development
}
```

## Production Deployment

1. **Set strong JWT secret**:
   ```env
   JWT_SECRET=<generate-strong-random-secret>
   ```

2. **Configure CORS**:
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Use HTTPS**: Deploy behind reverse proxy (Nginx, Traefik)

4. **Environment-specific URLs**: Update service URLs for production

5. **Monitoring**: Add APM (New Relic, Datadog)

## Future Enhancements

- [ ] API key authentication
- [ ] Request/response transformation
- [ ] Circuit breaker pattern
- [ ] Service discovery integration
- [ ] GraphQL gateway
- [ ] WebSocket support
- [ ] Response caching
- [ ] Request validation
