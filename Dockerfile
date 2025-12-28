# syntax=docker/dockerfile:1.7

# -----------------------
# 1. Base image
# -----------------------
FROM node:20-alpine AS base
WORKDIR /app

# Minimal OS deps (keep in base so all stages share it)
RUN apk add --no-cache libc6-compat

# Disable Next.js telemetry everywhere
ENV NEXT_TELEMETRY_DISABLED=1

# -----------------------
# 2. Dependencies stage (cacheable)
# -----------------------
FROM base AS deps

# Copy only manifests first for best cache reuse
COPY package.json package-lock.json* ./

# Cache npm downloads across builds (BuildKit)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# -----------------------
# 3. Build stage
# -----------------------
FROM base AS builder

# Build-time args: keep to non-secrets where possible
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG SITE_URL

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV SITE_URL=${SITE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# -----------------------
# 4. Production deps only (smaller runtime)
# -----------------------
FROM base AS prod-deps
COPY package.json package-lock.json* ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev && npm cache clean --force

# -----------------------
# 5. Runtime stage (Production)
# -----------------------
FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what is needed at runtime (use --chown to avoid extra chown layer)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

# Database / migrations
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Ensure entrypoint is included + executable
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

CMD ["./docker-entrypoint.sh"]