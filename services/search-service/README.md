# Search Service

Product search service with pluggable adapters (MeiliSearch or MongoDB fallback).

## Features

- **Pluggable Adapters**: Switch between MeiliSearch and MongoDB text search
- **Event-Driven Indexing**: Automatically indexes products from Kafka events
- **Full-Text Search**: Search products by name, description, and category
- **Configurable**: Easy adapter switching via environment variables

## API Endpoints

### Search Products

```bash
GET /api/v1/search?q=query&limit=20
```

**Query Parameters:**
- `q` (required) - Search query
- `limit` (optional, default: 20) - Maximum number of results

**Example:**
```bash
curl "http://localhost:3004/api/v1/search?q=laptop&limit=10"
```

**Response:**
```json
{
  "query": "laptop",
  "results": [
    {
      "id": "prod-123",
      "name": "Gaming Laptop",
      "description": "High-performance gaming laptop with RTX 4090",
      "price": 1999.99,
      "category": "Electronics",
      "stock": 15
    }
  ],
  "total": 1
}
```

## Search Adapters

### MeiliSearch Adapter (Recommended)

**Features:**
- Typo tolerance
- Fast search
- Advanced ranking
- Faceted search support

**Configuration:**
```env
SEARCH_PROVIDER=meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your-master-key
```

**Setup MeiliSearch:**
```bash
# Using Docker
docker run -d -p 7700:7700 \
  -e MEILI_MASTER_KEY=your-master-key \
  getmeili/meilisearch:latest
```

### MongoDB Adapter (Fallback)

**Features:**
- Text index search
- No external dependencies
- Good for simple use cases

**Configuration:**
```env
SEARCH_PROVIDER=mongodb
```

## Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/search-service
KAFKA_BROKERS=localhost:9092
PORT=3004
SEARCH_PROVIDER=mongodb  # or 'meilisearch'

# MeiliSearch (optional)
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your-key-here

NODE_ENV=development
```

## Running the Service

```bash
# Install dependencies
npm install

# Run with MongoDB adapter (default)
npm run dev

# Run with MeiliSearch adapter
# 1. Start MeiliSearch first
# 2. Update .env: SEARCH_PROVIDER=meilisearch
# 3. npm run dev
```

## Kafka Events

The service consumes the following events:

### product.created
Indexes a new product when created.

### product.updated
Updates an existing product in the search index.

## Testing

### 1. Index a Product (via Kafka simulation)

You'll need to publish `product.created` events. Example:

```typescript
// Simulate product creation
const event = {
  eventType: 'product.created',
  data: {
    productId: 'prod-123',
    name: 'Gaming Laptop',
    description: 'High-performance gaming laptop',
    price: 1999.99,
    category: 'Electronics',
    stock: 15
  }
};
```

### 2. Search for Products

```bash
curl "http://localhost:3004/api/v1/search?q=laptop"
```

### 3. Search with Limit

```bash
curl "http://localhost:3004/api/v1/search?q=gaming&limit=5"
```

## Adapter Comparison

| Feature | MeiliSearch | MongoDB |
|---------|-------------|---------|
| Typo Tolerance | ✅ Yes | ❌ No |
| Speed | ⚡ Very Fast | 🐢 Moderate |
| Setup | 🔧 External Service | ✅ Built-in |
| Ranking | 🎯 Advanced | 📊 Basic |
| Best For | Production | Development/Simple |

## Architecture

```
┌─────────────────┐
│  Kafka Events   │
│ product.created │
│ product.updated │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Event Consumers │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ Search Service  │─────▶│   Adapter    │
│   (Wrapper)     │      │  Interface   │
└─────────────────┘      └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              ┌─────▼──────┐        ┌──────▼──────┐
              │ MeiliSearch│        │   MongoDB   │
              │  Adapter   │        │   Adapter   │
              └────────────┘        └─────────────┘
```

## Implementation Details

### Search Adapter Interface

```typescript
interface SearchAdapter {
    index(product: Product): Promise<void>;
    update(product: Product): Promise<void>;
    search(query: string, limit?: number): Promise<Product[]>;
    delete(productId: string): Promise<void>;
}
```

### Switching Adapters

The adapter is selected at startup based on `SEARCH_PROVIDER` environment variable:

```typescript
if (searchProvider === 'meilisearch') {
    searchService.adapter = new MeiliSearchAdapter(host, apiKey);
} else {
    searchService.adapter = new MongoDBAdapter();
}
```

## Future Enhancements

- Faceted search (category, price range filters)
- Autocomplete/suggestions
- Search analytics
- Elasticsearch adapter
- Redis caching layer
