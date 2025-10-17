# Multi-stage build for React/Vite frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_BACKEND_URL=http://localhost:8000
ARG VITE_LIVEKIT_URL=ws://localhost:7880

# Set environment variables for build
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_LIVEKIT_URL=${VITE_LIVEKIT_URL}

# Build the main application
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

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
