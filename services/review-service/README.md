# Review Service

Product review management service with CRUD operations and admin controls.

## Features

- **Create Reviews**: Users can submit product reviews with ratings (1-5) and comments
- **Get Reviews**: Retrieve all reviews for a product with pagination and sorting
- **Delete Reviews**: Admin-only review deletion
- **Duplicate Prevention**: Users can only review each product once
- **Rating Statistics**: Automatic calculation of average ratings

## API Endpoints

### Create Review

```bash
POST /api/v1/reviews
```

**Headers:**
- `x-user-id`: User ID (auth placeholder)

**Request Body:**
```json
{
  "productId": "prod-123",
  "rating": 5,
  "comment": "Great product! Highly recommended."
}
```

**Response:**
```json
{
  "id": "review-id",
  "productId": "prod-123",
  "userId": "user-123",
  "rating": 5,
  "comment": "Great product! Highly recommended.",
  "createdAt": "2025-12-03T...",
  "updatedAt": "2025-12-03T..."
}
```

### Get Product Reviews

```bash
GET /api/v1/reviews/product/:productId
```

**Query Parameters:**
- `limit` (optional, default: 20) - Number of reviews to return
- `skip` (optional, default: 0) - Number of reviews to skip
- `sortBy` (optional, default: createdAt) - Sort field (createdAt or rating)
- `order` (optional, default: desc) - Sort order (asc or desc)

**Example:**
```bash
curl http://localhost:3003/api/v1/reviews/product/prod-123?limit=10&sortBy=rating&order=desc
```

**Response:**
```json
{
  "reviews": [
    {
      "id": "review-id",
      "productId": "prod-123",
      "userId": "user-123",
      "rating": 5,
      "comment": "Great product!",
      "createdAt": "2025-12-03T...",
      "updatedAt": "2025-12-03T..."
    }
  ],
  "total": 25,
  "averageRating": 4.5,
  "limit": 10,
  "skip": 0
}
```

### Delete Review (Admin Only)

```bash
DELETE /api/v1/reviews/:id
```

**Headers:**
- `x-admin`: "true" (admin auth placeholder)

**Example:**
```bash
curl -X DELETE http://localhost:3003/api/v1/reviews/review-123 \
  -H "x-admin: true"
```

**Response:** 204 No Content

## Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/review-service
PORT=3003
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

## Testing Examples

### 1. Create a Review

```bash
curl -X POST http://localhost:3003/api/v1/reviews \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-123" \
  -d '{
    "productId": "prod-123",
    "rating": 5,
    "comment": "Excellent product! Fast delivery and great quality."
  }'
```

### 2. Get Product Reviews

```bash
curl http://localhost:3003/api/v1/reviews/product/prod-123
```

### 3. Get Reviews Sorted by Rating

```bash
curl "http://localhost:3003/api/v1/reviews/product/prod-123?sortBy=rating&order=desc&limit=5"
```

### 4. Delete a Review (Admin)

```bash
curl -X DELETE http://localhost:3003/api/v1/reviews/review-id-here \
  -H "x-admin: true"
```

## Features

- **Duplicate Prevention**: Compound index on userId + productId prevents duplicate reviews
- **Rating Validation**: Ratings must be between 1-5
- **Comment Length**: Comments limited to 1000 characters
- **Average Rating**: Automatically calculated using MongoDB aggregation
- **Pagination**: Support for limit/skip pagination
- **Sorting**: Sort by creation date or rating

## Authentication Notes

The service uses placeholder headers for authentication:
- `x-user-id`: Simulates authenticated user
- `x-admin`: Simulates admin privileges

In production, replace with proper JWT authentication middleware.

## Database Schema

```typescript
{
  productId: string (indexed)
  userId: string
  rating: number (1-5)
  comment: string (max 1000 chars)
  createdAt: Date
  updatedAt: Date
}
```

**Indexes:**
- `productId`: For fast product review lookups
- `userId + productId`: Unique compound index to prevent duplicate reviews
