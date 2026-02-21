FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/worker/package.json packages/worker/package.json
COPY packages/prefeitura-mock/package.json packages/prefeitura-mock/package.json
COPY packages/frontend/package.json packages/frontend/package.json

RUN npm install --workspace=packages/prefeitura-mock

COPY tsconfig.base.json ./
COPY packages/prefeitura-mock/ packages/prefeitura-mock/

WORKDIR /app/packages/prefeitura-mock
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/packages/prefeitura-mock/dist ./dist
COPY --from=builder /app/packages/prefeitura-mock/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3002
CMD ["node", "dist/index.js"]
