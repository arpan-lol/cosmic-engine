FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY src/prisma ./prisma
RUN npx prisma generate

FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
COPY tsconfig.json ./

RUN npx prisma generate --schema=src/prisma/schema.prisma

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src/prisma ./src/prisma

COPY google-creds.json ./google-creds.json

EXPOSE 3006

CMD ["npm", "start"]
