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

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy package.json first for better caching
COPY package.json package-lock.json* ./

# Copy only necessary config files for build
COPY next.config.ts tsconfig.json tailwind.config.ts postcss.config.js components.json ./

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

# Install only production dependencies for runtime
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --omit=dev && npm cache clean --force

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts

# Copy cron script
COPY scripts/supabase-cron.sh /usr/local/bin/supabase-cron.sh
RUN chmod +x /usr/local/bin/supabase-cron.sh

# Install supercronic for cron job management (works with non-root users)
ENV SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.2.29/supercronic-linux-amd64 \
    SUPERCRONIC=supercronic-linux-amd64 \
    SUPERCRONIC_SHA1SUM=cd48d45c4b10f3f0bfdd3a57d054cd05ac96812b

RUN apk add --no-cache curl \
    && curl -fsSLO "$SUPERCRONIC_URL" \
    && echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c - \
    && chmod +x "$SUPERCRONIC" \
    && mv "$SUPERCRONIC" /usr/local/bin/supercronic

# Create crontab file
RUN echo "0 5 * * 0 /usr/local/bin/supabase-cron.sh >> /var/log/cron.log 2>&1" > /app/crontab

# Ensure correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Next.js default port
EXPOSE 3000

# Start both Next.js and supercronic
CMD supercronic /app/crontab & npm run start