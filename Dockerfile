# Multi-stage build for React/Vite frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy source code
COPY . .

# Build the main application (without build-time env vars)
RUN npm run build

# Build the widget
RUN npm run build:widget

# Production stage with nginx
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy custom nginx config
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy runtime environment configuration script
COPY env-config.sh /docker-entrypoint.d/env-config.sh
RUN chmod +x /docker-entrypoint.d/env-config.sh

# Expose port
EXPOSE 80

# Environment variables with defaults
ENV VITE_BACKEND_URL=http://localhost:8000
ENV VITE_LIVEKIT_URL=ws://localhost:7880

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx (env-config.sh runs automatically via docker-entrypoint.d)
CMD ["nginx", "-g", "daemon off;"]
