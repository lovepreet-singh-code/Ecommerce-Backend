FROM node:18-alpine AS builder

WORKDIR /app

# Copy common library first to leverage cache
COPY services/common ./services/common
WORKDIR /app/services/common
RUN npm install && npm run build

# Build user service
WORKDIR /app/services/user-service
COPY services/user-service/package*.json ./
RUN npm install
COPY services/user-service/tsconfig.json ./
COPY services/user-service/src ./src
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/services/common ./services/common
COPY --from=builder /app/services/user-service/dist ./dist
COPY --from=builder /app/services/user-service/package*.json ./
COPY --from=builder /app/services/user-service/node_modules ./node_modules

EXPOSE 4000

CMD ["npm", "start"]
