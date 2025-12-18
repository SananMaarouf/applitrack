# -----------------------
# 1. Base image
# -----------------------
FROM node:20-alpine AS base

WORKDIR /app

# Install OS deps
RUN apk add --no-cache libc6-compat

# -----------------------
# 2. Dependencies stage
# -----------------------
FROM base AS deps

# Copy package manifests
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci --legacy-peer-deps

# -----------------------
# 3. Build stage
# -----------------------
FROM base AS builder

WORKDIR /app

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Accept all required environment variables as build args
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG SITE_URL
ARG DATABASE_URL

# Set them as environment variables for the build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV SITE_URL=${SITE_URL}
ENV DATABASE_URL=${DATABASE_URL}

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Build Next.js app
RUN npm run build

# -----------------------
# 4. Runtime stage (Production)
# -----------------------
FROM base AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Ensure Next.js listens on all interfaces
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
# Copy public assets
COPY --from=builder /app/public ./public

# Copy Next.js standalone output (if using standalone mode) or .next folder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Copy node_modules (production deps will be installed separately)
COPY --from=builder /app/node_modules ./node_modules

# Copy package.json for npm start
COPY --from=builder /app/package.json ./package.json

# Copy next.config.ts (needed at runtime)
COPY --from=builder /app/next.config.ts ./next.config.ts

# Copy database-related files (for migrations)
COPY --from=builder /app/db ./db
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/scripts ./scripts

# Copy the entrypoint script
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Start Next.js server with migrations
CMD ["./docker-entrypoint.sh"]