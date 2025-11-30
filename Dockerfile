# Build stage for client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci

# Copy client source
COPY client/ ./

# Build client
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server source files
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY config.json ./

# Copy and make the AntigravityRequester binary executable
COPY src/bin/ ./src/bin/
RUN chmod +x ./src/bin/antigravity_requester_linux_amd64 2>/dev/null || true

# Copy built client from builder stage
COPY --from=client-builder /app/client/dist ./client/dist

# Create necessary directories
RUN mkdir -p data uploads public/images

# Expose the port
EXPOSE 8045

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8045/admin/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "src/server/index.js"]
