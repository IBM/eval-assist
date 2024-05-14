# Install dependencies only when needed
FROM node:lts-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --prod --non-interactive --ignore-scripts
# If using npm with a `package-lock.json` comment out above and use below instead
# COPY package.json package-lock.json ./
# RUN npm ci --omit=dev

# Rebuild the source code only when needed
FROM node:lts-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1
ENV TSC_COMPILE_ON_ERROR=true

ARG DATABASE_URL
ENV DATABASE_URL $DATABASE_URL

ARG NEXT_PUBLIC_BACKEND_API_HOST
ENV NEXT_PUBLIC_BACKEND_API_HOST $NEXT_PUBLIC_BACKEND_API_HOST

ARG NEXTAUTH_SECRET
ENV NEXTAUTH_SECRET $NEXTAUTH_SECRET

ARG NEXTAUTH_URL
ENV NEXTAUTH_URL $NEXTAUTH_URL

ARG AUTH_PROVIDER_ID
ENV AUTH_PROVIDER_ID $AUTH_PROVIDER_ID

ARG AUTH_PROVIDER_NAME
ENV AUTH_PROVIDER_NAME $AUTH_PROVIDER_NAME

ARG AUTH_WELL_KNOWN
ENV AUTH_WELL_KNOWN $AUTH_WELL_KNOWN

ARG AUTH_CLIENT_ID
ENV AUTH_CLIENT_ID $AUTH_CLIENT_ID

ARG AUTH_CLIENT_SECRET
ENV AUTH_CLIENT_SECRET $AUTH_CLIENT_SECRET

ARG NEXT_PUBLIC_USE_AUTH
ENV NEXT_PUBLIC_USE_AUTH $NEXT_PUBLIC_USE_AUTH

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

RUN yarn prisma generate
RUN yarn build
# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM node:lts-alpine AS runner
WORKDIR /app

# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1
# get NODE_ENV from Travis - allow console logging etc. on dev

ENV GENAI_KEY $GENAI_KEY
ENV GENAI_API $GENAI_API

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
ENV PORT 3000

CMD ["node", "server.js"]
