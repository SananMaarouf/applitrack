# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables at build time
ARG VITE_API_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLERK_SIGN_IN_URL=/sign-in
ARG VITE_CLERK_SIGN_UP_URL=/sign-up
ARG VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
ARG VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_SIGN_IN_URL=$VITE_CLERK_SIGN_IN_URL
ENV VITE_CLERK_SIGN_UP_URL=$VITE_CLERK_SIGN_UP_URL
ENV VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=$VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
ENV VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=$VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL

# Build the application
RUN npm run build


# Production stage - serve with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
