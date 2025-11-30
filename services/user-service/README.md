# User Service

Manages user registration, authentication, and profiles.

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

   The service will be available at `http://localhost:4000`.

## Docker

1. **Build Image**
   ```bash
   docker build -t user-service .
   ```

2. **Run Container**
   ```bash
   docker run -p 4000:4000 user-service
   ```

## API Endpoints

- `GET /health`: Health check
- `POST /auth/register`: Register a new user
- `POST /auth/login`: Login
- `GET /users/me`: Get current user profile
