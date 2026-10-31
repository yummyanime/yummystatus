# syntax=docker/dockerfile:1
FROM oven/bun:1.3.13-alpine AS deps

ENV SKIP_INSTALL_SIMPLE_GIT_HOOKS=1
WORKDIR /app
COPY package.json bun.lock tsconfig.base.json ./
COPY db/package.json db/
COPY api/package.json api/
COPY collector/package.json collector/
COPY bot/package.json bot/
COPY site/package.json site/
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked bun install --frozen-lockfile

FROM deps AS dev

WORKDIR /app/site
EXPOSE 5173
CMD ["bunx", "vite", "--host", "0.0.0.0"]

FROM deps AS build

COPY domains.ts ./
COPY db/src db/src
COPY api/src api/src
COPY site site

WORKDIR /app/site
RUN bun run build

FROM caddy:2-alpine

COPY <<EOF /etc/caddy/Caddyfile
:80 {
	root * /srv
	@manifest path *.webmanifest
	header @manifest Content-Type application/manifest+json
	try_files {path} /index.html
	file_server
}
EOF
COPY --from=build /app/site/dist /srv
