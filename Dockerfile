# -----------------------
# 1. Base deps image
# -----------------------
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Ensure production parity
ENV NODE_ENV=production

# -----------------------
# 2. Dependencies stage
# -----------------------
FROM base AS deps

# Install OS deps if needed (openssl generally already there)
RUN apk add --no-cache libc6-compat

# Copy package manifests
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./ 

# Install dependencies (prefer npm since package.json uses npm scripts)
RUN npm install --legacy-peer-deps --omit=dev

# -----------------------
# 3. Build stage
# -----------------------
FROM base AS builder

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set env for Next.js build (can be overridden in Dokploy)
ENV NEXT_TELEMETRY_DISABLED=1

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

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# Copy .next and required config
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/postcss.config.js ./postcss.config.js

# Copy node_modules from deps for runtime
COPY --from=deps /app/node_modules ./node_modules

# Ensure correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Next.js default port
EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "run", "start"]