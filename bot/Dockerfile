FROM oven/bun:1.3.13-slim AS base
ENV SKIP_INSTALL_SIMPLE_GIT_HOOKS=1
WORKDIR /app
COPY package.json bun.lock tsconfig.base.json ./
COPY db/package.json ./db/
COPY api/package.json ./api/
COPY collector/package.json ./collector/
COPY bot/package.json ./bot/
COPY site/package.json ./site/

FROM base AS dev
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked bun install --frozen-lockfile
COPY bot ./bot
COPY domains.ts ./
WORKDIR /app/bot
CMD ["bun", "--hot", "src/index.ts"]

FROM base AS prod
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked bun install --production --frozen-lockfile --ignore-scripts
COPY bot ./bot
COPY domains.ts ./
WORKDIR /app/bot
CMD ["bun", "src/index.ts"]
