FROM node:24.21.0-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts=false \
    && npm cache clean --force

COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31.6-alpine3.24

COPY --chown=101:101 nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 nginx/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html
RUN chmod 0755 /docker-entrypoint.d/40-runtime-config.sh

USER 101

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=6 \
  CMD ["wget", "-qO-", "http://127.0.0.1:8080/health"]
