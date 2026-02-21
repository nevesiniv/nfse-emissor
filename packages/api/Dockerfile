FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/worker/package.json packages/worker/package.json
COPY packages/prefeitura-mock/package.json packages/prefeitura-mock/package.json
COPY packages/frontend/package.json packages/frontend/package.json

RUN npm install --workspace=packages/api

COPY tsconfig.base.json ./
COPY packages/api/ packages/api/

WORKDIR /app/packages/api
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache openssl
ENV NODE_OPTIONS=--openssl-legacy-provider

WORKDIR /app

COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/packages/api/package.json ./
COPY --from=builder /app/packages/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

COPY packages/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3001
CMD ["./entrypoint.sh"]
