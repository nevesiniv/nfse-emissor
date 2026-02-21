FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/worker/package.json packages/worker/package.json
COPY packages/prefeitura-mock/package.json packages/prefeitura-mock/package.json
COPY packages/frontend/package.json packages/frontend/package.json
COPY packages/api/prisma packages/api/prisma

RUN npm install --workspace=packages/worker

COPY tsconfig.base.json ./
COPY packages/worker/ packages/worker/

WORKDIR /app/packages/worker
RUN npx prisma generate --schema=../api/prisma/schema.prisma
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache openssl
ENV NODE_OPTIONS=--openssl-legacy-provider

WORKDIR /app

COPY --from=builder /app/packages/worker/dist ./dist
COPY --from=builder /app/packages/worker/package.json ./
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/index.js"]
