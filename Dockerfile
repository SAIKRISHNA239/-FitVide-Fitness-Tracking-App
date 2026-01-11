# ============================================
# Multi-stage Dockerfile for Expo Web App
# ============================================
# Stage 1: Builder - Install dependencies and build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies needed for native modules (if any)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Export the web app
RUN npx expo export -p web

# ============================================
# Stage 2: Runner - Serve with nginx
# ============================================
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
