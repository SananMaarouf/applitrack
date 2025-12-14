# -----------------------
# 1. Base deps image
# -----------------------
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# -----------------------
# 2. Dependencies stage
# -----------------------
FROM base AS deps

# Install OS deps if needed (openssl generally already there)
RUN apk add --no-cache libc6-compat

# Copy package manifests
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./ 

# Install ALL dependencies (including devDependencies needed for build)
# Don't set NODE_ENV=production here as it would skip devDependencies
RUN npm ci --legacy-peer-deps

# -----------------------
# 3. Build stage
# -----------------------
FROM base AS builder

# Set env for Next.js build (can be overridden in Dokploy)
ENV NEXT_TELEMETRY_DISABLED=1

# Accept Clerk keys as build args (required for build-time validation)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY

# Set them as environment variables for the build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy package.json first for better caching
COPY package.json package-lock.json* ./

# Copy only necessary config files for build
COPY next.config.ts tsconfig.json tailwind.config.ts postcss.config.js components.json ./

# Copy database files (needed for build)
COPY db ./db
COPY drizzle.config.ts ./

# Copy source directories
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY public ./public
COPY store ./store
COPY types ./types
COPY utils ./utils
COPY middleware.ts ./

# Build Next.js app
RUN npm run build

# -----------------------
# 4. Runtime stage
# -----------------------
FROM base AS runner

# Next.js runtime env
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

WORKDIR /app

# Copy package.json first
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --legacy-peer-deps --omit=dev && npm cache clean --force

# Copy TypeScript and @types/node from builder (needed for next.config.ts at runtime)
COPY --from=builder /app/node_modules/typescript ./node_modules/typescript
COPY --from=builder /app/node_modules/@types/node ./node_modules/@types/node

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts

# Copy database-related files
COPY --from=builder /app/db ./db
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Ensure correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Next.js default port
EXPOSE 3000

# Start Next.js
CMD npm run start