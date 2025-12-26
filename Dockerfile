# =============================================================================
# Aynux Frontend Multi-Stage Dockerfile
# Vue.js 3 + TypeScript + Vite + Nginx
# =============================================================================
# Build targets:
#   - builder: Build stage with Node.js
#   - production: Nginx serving static files
#
# Usage:
#   docker build -t aynux-frontend:prod .
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t aynux-frontend:prod .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build the Vue.js application
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Build arguments for Vite environment variables
# These are injected at BUILD TIME, not runtime
ARG VITE_API_BASE_URL=
ARG VITE_API_V1_STR=/api/v1

# Set as environment variables for Vite build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_V1_STR=${VITE_API_V1_STR}

WORKDIR /app

# Copy package files for layer caching
COPY package.json package-lock.json ./

# Install dependencies (ci for reproducible builds)
RUN npm ci --prefer-offline

# Copy source code
COPY . .

# Build the production bundle
RUN npm run build

# Verify build output
RUN ls -la dist/ && test -f dist/index.html

# -----------------------------------------------------------------------------
# Stage 2: Production Nginx image
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user for security
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -D appuser && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown appuser:appgroup /var/run/nginx.pid

# Expose port 80 (internal - mapped to 8000 externally)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Run as non-root
USER appuser

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
