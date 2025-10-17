# =============================================
# Stage 1: Build Application
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Regenerar package-lock.json si es necesario y luego hacer clean install
# Esto asegura que el lock esté siempre sincronizado con package.json
RUN npm install --package-lock-only && npm ci

# Copy source code
COPY . .

# Build the application for production
RUN npm run build -- --configuration production

# =============================================
# Stage 2: Production Image
# =============================================
FROM nginx:1.25-alpine AS production

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist/hr-frontend/browser /usr/share/nginx/html

# Set correct permissions (nginx user already exists in the base image)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
