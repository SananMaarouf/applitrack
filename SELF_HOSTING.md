# Self-Hosting Applitrack

This guide walks through running your own instance of Applitrack, either on
your local machine for evaluation/development, or on a server you control
(e.g. a VPS running [Dokploy](https://dokploy.com/)).

Applitrack is licensed under [AGPL-3.0](LICENSE). If you run a modified
version of it as a network service that other people use, you must make the
source of your modified version available to them — see the [LICENSE](LICENSE)
file for the full terms.

## Contents

- [Prerequisites](#prerequisites)
- [1. Set up Clerk (authentication)](#1-set-up-clerk-authentication)
- [2. (Optional) Set up Cloudflare R2 (file attachments)](#2-optional-set-up-cloudflare-r2-file-attachments)
- [Path A — Run locally with Docker Compose](#path-a--run-locally-with-docker-compose)
- [Path B — Run in production (your own server / Dokploy)](#path-b--run-in-production-your-own-server--dokploy)
- [Environment variable reference](#environment-variable-reference)
- [First run](#first-run)
- [Backups](#backups)
- [Before you go live: things to customize](#before-you-go-live-things-to-customize)

## Prerequisites

| Requirement | Needed for |
|---|---|
| [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/) | Both paths below |
| A free [Clerk](https://clerk.com/) account | Authentication — required |
| A [Cloudflare](https://www.cloudflare.com/) account with R2 enabled | File attachments on applications — optional, the app runs fine without it |
| A domain name (for production) | Only needed for Path B |

Applitrack stores all application data in a single SQLite file — there is no
separate database server to provision. See the [Database](README.md#database)
section of the README for details.

## 1. Set up Clerk (authentication)

1. Create a free account at [clerk.com](https://clerk.com/) and create a new
   application.
2. In the Clerk dashboard, go to **API Keys** and copy:
   - the **Publishable key** → this becomes `VITE_CLERK_PUBLISHABLE_KEY`
   - the **Secret key** → this becomes `CLERK_SECRET_KEY`
3. Clerk's hosted sign-in/sign-up components need to know which routes in
   your frontend handle auth. Applitrack expects `/sign-in` and `/sign-up`,
   redirecting to `/dashboard` after success — these are the defaults used
   by `VITE_CLERK_SIGN_IN_URL`, `VITE_CLERK_SIGN_UP_URL`,
   `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, and
   `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`. You generally don't need to
   change these unless you restructure the frontend's routes.
4. Keep this a **development** Clerk instance while you're testing locally;
   switch to a **production** Clerk instance (with your real domain
   configured) before exposing Applitrack to other people.

## 2. (Optional) Set up Cloudflare R2 (file attachments)

Skip this section if you don't need application attachments — the backend
works fine with these variables left blank.

1. In the Cloudflare dashboard, enable **R2** and create a bucket
   (e.g. `applitrack-attachments`).
2. Create an **R2 API token** with read/write access to that bucket. Note the
   **Access Key ID** and **Secret Access Key**.
3. Find your **Account ID** on the Cloudflare dashboard's right sidebar (also
   visible in the R2 overview page). The backend builds the R2 endpoint from
   this automatically — you don't need to set `R2_ENDPOINT` yourself.
4. You'll fill these into `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` below.

## Path A — Run locally with Docker Compose

This is the fastest way to try Applitrack out. It runs the backend and
frontend in dev mode with hot reload, using `docker-compose.yml`.

```bash
git clone https://github.com/<your-fork-or-source>/applitrack.git
cd applitrack

cp .env.local.example .env.local
```

Edit `.env.local` and fill in at minimum:

```
CLERK_SECRET_KEY=sk_test_...
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
VITE_API_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

Leave `DATABASE_URL` and the `R2_*` variables blank/default unless you set up
R2 attachments above.

`docker-compose.yml` builds the frontend from `frontend/Dockerfile.dev`,
which serves it with Vite directly and reads its own `VITE_*` variables from
the environment injected by Compose — so `.env.local` at the repo root is
enough; you do **not** need a separate `frontend/.env.local` when running
through Docker Compose. (You would need one only if you run `npm run dev`
directly on your host instead of through Docker — see
[vite.config.ts](frontend/vite.config.ts), which loads env files from the
`frontend/` directory.)

Start everything:

```bash
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000) (interactive
  docs at `/docs` since `ENVIRONMENT=development`)

Database migrations run automatically when the backend container starts. The
SQLite file lives at `backend/data/applitrack.db` on your host, bind-mounted
into the container — it survives `docker compose down` / restarts.

## Path B — Run in production (your own server / Dokploy)

Production uses the **production** Dockerfiles (`backend/Dockerfile`,
`frontend/Dockerfile`) — multi-stage, non-root, no hot reload — rather than
the `.dev` ones used by `docker-compose.yml`. There are two ways to get
these images running: build them yourself, or let CI build and publish them
to a Docker Hub account you control.

### Option 1: Build the images yourself

This is the simplest path if you don't want to set up CI/CD or a Docker Hub
account.

```bash
# Backend
docker build -t applitrack-backend:latest ./backend

# Frontend — note the VITE_* build args are baked into the compiled
# JavaScript at build time, so they must be passed here, not as
# container env vars at runtime.
docker build -t applitrack-frontend:latest ./frontend \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_... \
  --build-arg VITE_CLERK_SIGN_IN_URL=/sign-in \
  --build-arg VITE_CLERK_SIGN_UP_URL=/sign-up \
  --build-arg VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard \
  --build-arg VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

Push these images to wherever your server can pull them from (a private
registry, or just build directly on the server), then run them:

```bash
docker run -d --name applitrack-backend \
  -p 8000:8000 \
  -v applitrack-data:/app/data \
  -e CLERK_SECRET_KEY=sk_live_... \
  -e CORS_ORIGINS=https://yourdomain.com \
  -e ENVIRONMENT=production \
  applitrack-backend:latest

docker run -d --name applitrack-frontend \
  -p 80:80 \
  applitrack-frontend:latest
```

Put a reverse proxy (Caddy, nginx, Traefik, or Dokploy's built-in Traefik)
in front of both with TLS termination for your domain.

### Option 2: Use CI to build and publish images, deploy via Dokploy

This is what this repository's own `.github/workflows/` are set up to do,
and what the original project uses in production. It's more setup but means
every push to `master` automatically builds and redeploys.

1. **Fork/host this repo** on GitHub (or your Git host of choice — the
   workflow files assume GitHub Actions).
2. **Create a Docker Hub account** (or use another registry, adjusting the
   workflow) and add these repo secrets: `DOCKERHUB_USERNAME`,
   `DOCKERHUB_TOKEN`.
3. Add the frontend build-time secrets: `VITE_API_URL`,
   `VITE_CLERK_PUBLISHABLE_KEY` (these get baked into the published frontend
   image).
4. Set up Dokploy on your server, then in Dokploy:

   **Backend service**
   1. Create a new **Application** using the Docker provider, image
      `<DOCKERHUB_USERNAME>/applitrack-backend:latest`.
   2. Add a **volume** mounted at `/app/data` so the SQLite database
      survives redeploys.
   3. Expose port `8000` and set the domain/proxy for your API host.
   4. Set environment variables: `DATABASE_URL`
      (`sqlite+aiosqlite:////app/data/applitrack.db`), `CLERK_SECRET_KEY`,
      `CORS_ORIGINS`, `ENVIRONMENT=production`, and the `R2_*` variables if
      attachments are enabled.
   5. Under **Deployments**, copy the generated deploy webhook URL into the
      `DOKPLOY_BACKEND_DEPLOY_HOOK_URL` GitHub secret.

   **Frontend service**
   1. Create a second Application using image
      `<DOCKERHUB_USERNAME>/applitrack-frontend:latest`.
   2. Expose port `80` (nginx) and set the domain for your site.
   3. Copy the frontend deploy webhook URL into
      `DOKPLOY_FRONTEND_DEPLOY_HOOK_URL`.
5. If you want Cloudflare Access sitting in front of the deploy webhooks,
   also set `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET`; otherwise
   leave them blank and simplify `trigger-deployment.yml` to call the
   webhooks directly.

CI runs Alembic migrations against the deployed volume automatically on
backend startup — you generally don't need to run `alembic upgrade head`
by hand, except for manual/offline cutover scenarios.

## Environment variable reference

| Variable | Where used | Required? | Notes |
|---|---|---|---|
| `CLERK_SECRET_KEY` | Backend | **Yes** (unless `ENVIRONMENT=testing`) | From Clerk dashboard → API Keys |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend (build-time) | **Yes** | From Clerk dashboard → API Keys |
| `VITE_CLERK_SIGN_IN_URL` | Frontend (build-time) | No — defaults to `/sign-in` | |
| `VITE_CLERK_SIGN_UP_URL` | Frontend (build-time) | No — defaults to `/sign-up` | |
| `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Frontend (build-time) | No — defaults to `/dashboard` | |
| `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Frontend (build-time) | No — defaults to `/dashboard` | |
| `VITE_API_URL` | Frontend (build-time) | **Yes** | Base URL the frontend uses to call the backend, e.g. `https://api.yourdomain.com` |
| `DATABASE_URL` | Backend | No | Defaults to `sqlite+aiosqlite:////app/data/applitrack.db` in the container; use `sqlite+aiosqlite:///./data/applitrack.db` for non-Docker local runs |
| `CORS_ORIGINS` | Backend | **Yes** | Comma-separated list of allowed frontend origins; also used as Clerk's authorized parties |
| `ENVIRONMENT` | Backend | **Yes** | `development`, `production`, or `testing`. **Never use `testing` in a real deployment** — it disables real Clerk verification |
| `R2_ACCOUNT_ID` | Backend | Only for attachments | |
| `R2_ACCESS_KEY_ID` | Backend | Only for attachments | |
| `R2_SECRET_ACCESS_KEY` | Backend | Only for attachments | |
| `R2_BUCKET_NAME` | Backend | Only for attachments | |
| `R2_ENDPOINT` | Backend | No | Currently unused — the backend derives the endpoint from `R2_ACCOUNT_ID` |
| `SITE_URL` | Deployment tooling | No | Canonical site URL for links/redirects |
| `FRONTEND_PORT` | Dokploy deployment | No | Port the frontend service listens on in production |
| `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` | CI only | Only if using Option 2 above | |
| `DOKPLOY_BACKEND_DEPLOY_HOOK_URL` / `DOKPLOY_FRONTEND_DEPLOY_HOOK_URL` | CI only | Only if using Option 2 above | |
| `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` | CI only | Only if you put Cloudflare Access in front of the deploy webhooks | |

See [`.env.example`](.env.example) (production/Dokploy reference),
[`.env.local.example`](.env.local.example) (local Docker Compose dev), and
[`backend/.env.test.example`](backend/.env.test.example) (running the test
suite) for the exact files these values go into.

## First run

1. Once the backend and frontend are both up, open the frontend URL.
2. Sign up for an account through Clerk's hosted sign-up flow.
3. Add your first job application to confirm the backend, database, and
   auth are all wired up correctly.
4. If you enabled R2, attach a file to an application to confirm storage
   works.
5. Alembic migrations run automatically on backend startup — check the
   backend container logs to confirm they applied cleanly, and hit
   `/health` to confirm the service is up.

## Backups

Applitrack's entire dataset lives in one SQLite file. Back it up with:

```bash
sqlite3 /app/data/applitrack.db ".backup /path/to/backup.db"
```

on a schedule, or stream it continuously with a tool like
[Litestream](https://litestream.io/) to an R2 bucket. **Don't** copy the
file with `cp` while the app is running — `.backup` is the safe way to
snapshot a live SQLite database. See
[`backend/scripts/README.md`](backend/scripts/README.md) for more detail
(written for a one-off PostgreSQL→SQLite migration, but the backup section
applies generally).

## Before you go live: things to customize

A few things in this codebase reference the original author/deployment and
should be reviewed before you run this for other people:

- **Terms of Service and account pages**
  ([`frontend/src/routes/terms-of-service.tsx`](frontend/src/routes/terms-of-service.tsx)
  and [`frontend/src/routes/my-account.tsx`](frontend/src/routes/my-account.tsx))
  hardcode a name and email address as the legal data controller/contact.
  **This is legally-binding text shown to your users** — replace it with
  your own name/organization and contact details before exposing the app to
  anyone but yourself.
- **README screenshot URL** ([`README.md`](README.md)) points at the
  original repository — update it if you've forked to a different location.
- **Domain names** in any Dokploy configuration, CORS origins, and Clerk
  instance settings should point at your own domain, not the original
  project's.
