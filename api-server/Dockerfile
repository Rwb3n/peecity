# last updated on: 2025-08-27 23:46:21
# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S expressjs -u 1001

# Copy dependencies and application
COPY --from=builder /app/node_modules ./node_modules
COPY server.js ./

# Copy toilet data  
COPY data ./data

# Change ownership to nodejs user
RUN chown -R expressjs:nodejs /app

# Switch to non-root user  
USER expressjs

# Expose port (Cloud Run will set PORT env variable)
EXPOSE 8080

# Set environment
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]