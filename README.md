# YummyStatus

A simple service for monitoring website availability via HTTP requests using the [globalping.io](https://globalping.io/) API.

The service collects statistics on response time, status codes, and other parameters, then visualizes them as charts.

<img width="1851" height="1224" alt="Image" src="https://github.com/user-attachments/assets/d56eeffc-f7ac-4c1f-9831-d8a47bb828dc" />

## Tech stack

### Monorepo (bun workspaces)

- `domains.ts`: single source of truth for monitored domains, groups and locations.
- `db`: Drizzle ORM schema, client and SQL migrations (applied automatically at API startup).
- `api`: Hono + zod HTTP API under `/api/*`; exports `AppType` for typed `hc` clients.
- `collector`: HTTP, ping and Lighthouse checks, hourly aggregation, cleanup of old logs.
- `bot`: Telegram alert bot talking to the API through `hc<AppType>`.
- `site`: React + Vite + Chart.js + Sass frontend, served by a Caddy static image.

### Infrastructure

- **Bun** and **TypeScript**: runtime and language for all services.
- **PostgreSQL 13**: relational database.
- **Docker** and **Caddy**: one image per service, Caddy gateway with automatic HTTPS.
- **GitHub Actions**: builds images to GHCR and deploys them with `docker compose`.

## Tooling

- **Biome**: Linting and formatting (`bun run lint`, `bun run format`).
- **simple-git-hooks**: A `pre-commit` hook runs `bun run typecheck` before every commit.

## Local setup

### Prerequisites

- [Docker](https://www.docker.com/)

### Running

1.  Copy the env template and fill in the values:

    ```bash
    cp .env.example .env
    ```

2.  Start the database, API, collector and site:

    ```bash
    bun run dev
    ```

    Equivalent to `docker compose up -d --build --wait --remove-orphans`: `docker-compose.override.yml` is applied on top of `docker-compose.yml` automatically, and the `bot` and `caddy` services (profile `prod`) are not started locally.

The site will then be available at `http://localhost:15173` (API on `http://localhost:13000`, Postgres on `127.0.0.1:15432`).
