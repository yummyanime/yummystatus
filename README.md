# YummyStatus

A simple service for monitoring website availability via HTTP requests using the [globalping.io](https://globalping.io/) API.

The service collects statistics on response time, status codes, and other parameters, then visualizes them as charts.

<img width="1851" height="1224" alt="Image" src="https://github.com/user-attachments/assets/d56eeffc-f7ac-4c1f-9831-d8a47bb828dc" />

## Tech stack

### Frontend

- **React**: UI library.
- **TypeScript**: Typed JavaScript.
- **Vite**: Frontend build tool.
- **Chart.js**: Charting library.
- **Sass**: CSS preprocessor.

### Backend

- **Node.js**: JavaScript runtime.
- **Express.js**: Web framework for Node.js.
- **PostgreSQL**: Relational database.

### Deployment

- **Docker**: Application containerization platform.
- **Nginx**: Web server and reverse proxy.

## Tooling

- **Biome**: Linting and formatting (`bun run lint`, `bun run format`).
- **simple-git-hooks**: A `pre-commit` hook runs `bun run typecheck` before every commit.

## Local setup

### Prerequisites

- [Bun](https://bun.sh/) (version 1.x or higher)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/Fristaylo/yummystatus.git
    cd yummystatus
    ```

2.  Install dependencies:

    ```bash
    bun install
    ```

### Running

1.  Start the server and client:

    ```bash
    bun run dev
    ```

The client will then be available at `http://localhost:5173`.

## Server deployment

### Prerequisites

- [Docker](https://www.docker.com/)

### Building and running the containers

To run the project with Docker, execute the following command in the project root directory:

```bash
docker-compose up --build
```
