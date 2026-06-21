# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:24-alpine
ARG CADDY_IMAGE=caddy:2-alpine
ARG NPM_VERSION=11.6.2
ARG DEFAULT_PORT

FROM ${NODE_IMAGE} AS build

WORKDIR /app

ARG NPM_VERSION
RUN npm install -g npm@${NPM_VERSION}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM ${CADDY_IMAGE} AS runner

ARG DEFAULT_PORT
ENV PORT=${DEFAULT_PORT}
WORKDIR /srv

COPY Caddyfile /etc/caddy/Caddyfile
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY --from=build /app/dist/lari-finance-app/browser /srv

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
