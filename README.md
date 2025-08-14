# AI Chat Application

Next.js application to use the AI SDK 5 for streaming.

Based on the [AIhero DeepSearch AI application](https://www.aihero.dev/cohorts/build-deepsearch-in-typescript)

## API Routes

The application includes API routes that handle both POST (new messages) and GET (reconnection) requests:

- `POST /api/chat`: Handles new message submissions
- `GET /api/chat?id=...`: Handles reconnection requests

## Setup

1. Install dependencies with `pnpm`

```bash
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

3. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

4. Run `./start-database.sh` to start the database.

5. Run `./start-redis.sh` to start the Redis server.
