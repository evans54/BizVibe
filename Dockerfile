FROM node:18-alpine AS builder

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine AS runtime

WORKDIR /app

# Copy backend
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy built frontend
COPY --from=builder /app/frontend/dist ./public

# Create a simple static file server for frontend
COPY --from=builder /app/frontend/package*.json ./
RUN npm ci --only=production

# Create server that serves frontend and API
COPY serve.js ./

EXPOSE 8080

CMD ["node", "serve.js"]
