# Install dependencies only when needed
FROM node:lts-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# If using npm with a `package-lock.json` comment out above and use below instead
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Rebuild the source code only when needed
FROM node:lts-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_BACKEND_API_HOST
ENV NEXT_PUBLIC_BACKEND_API_HOST $NEXT_PUBLIC_BACKEND_API_HOST

ARG NEXT_PUBLIC_USE_AUTH
ENV NEXT_PUBLIC_USE_AUTH $NEXT_PUBLIC_USE_AUTH

# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1
ENV TSC_COMPILE_ON_ERROR=true

RUN npm run build
# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM node:lts-alpine AS runner
WORKDIR /app

# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1
# get NODE_ENV from Travis - allow console logging etc. on dev

# make sure next can find sharp
# https://github.com/vercel/next.js/discussions/40125
ENV NEXT_SHARP_PATH /app/node_modules/sharp

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["node", "server.js"]
