FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/worker/package.json packages/worker/package.json
COPY packages/prefeitura-mock/package.json packages/prefeitura-mock/package.json
COPY packages/frontend/package.json packages/frontend/package.json

RUN npm install --workspace=packages/frontend

COPY packages/frontend/ packages/frontend/

WORKDIR /app/packages/frontend
ENV VITE_API_URL=/api
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
