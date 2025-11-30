# Ecommerce Backend

Monorepo for the Ecommerce Backend microservices.

## Quick Start

1. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```

2. **Start Infrastructure**
   ```bash
   docker-compose -f deployment/docker-compose.yml up --build
   ```

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway (Nginx) | 8080 | Entry point for all requests |
| Zookeeper | 2181 | Coordination service for Kafka |
| Kafka | 9092 | Message broker |
| MongoDB | 27017 | NoSQL Database |
| Redis | 6379 | In-memory data store |

## Health Endpoints

- **API Gateway**: `http://localhost:8080/health`
