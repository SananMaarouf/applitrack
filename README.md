# Applitrack

A job application tracker designed to help you stay organized during your job search. It keeps a record of the positions you've applied to, the companies, and your progress through each application process.

In addition to tracking, Applitrack provides insightful statistics about your job hunt, visualized through an informative Sankey diagram.

![Applitrack UI](https://raw.githubusercontent.com/SananMaarouf/applitrack/master/applitrack.png)


# Stack
- [Vite + React](https://vitejs.dev/)
- [TanStack Router](https://tanstack.com/router)
- [FastAPI](https://fastapi.tiangolo.com/) - Backend API
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://zod.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Clerk](https://clerk.com/) - Authentication (planned for the new frontend/backend)
- [PostgreSQL](https://www.postgresql.org/) - Database


# Development

## Prerequisites

- Docker & Docker Compose
- Node.js 24+ (for local frontend development)
- Python 3.12+ (for local backend development)

## Run everything with Docker (Development)

Starts PostgreSQL, the FastAPI backend, and the Vite + TanStack Router frontend:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000 (health: http://localhost:8000/health)
- Postgres: localhost:5432

## Auth note

The FastAPI backend currently expects a temporary `X-User-Id` header so you can develop the API + UI quickly.
This is intended to be replaced with proper Clerk JWT verification.


# Production Deployment

## 1. Configure Environment Variables

Copy the example environment file and fill in your production values:

```bash
cp .env.example .env
```

Required variables:
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Strong database password
- `POSTGRES_DB` - Database name
- `CORS_ORIGINS` - Your production frontend URL (e.g., `https://yourdomain.com`)
- `VITE_API_URL` - Your production backend URL (e.g., `https://api.yourdomain.com`)
- `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key

## 2. Build and Deploy

```bash
# Build and start production containers
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop containers
docker compose -f docker-compose.prod.yml down
```

## 3. Production Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (nginx/caddy) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Frontend │  │ Backend  │  │ Backend  │
        │ (nginx)  │  │ (uvicorn)│  │ (uvicorn)│
        └──────────┘  └────┬─────┘  └────┬─────┘
                           │              │
                           └──────┬───────┘
                                  │
                           ┌──────▼──────┐
                           │  PostgreSQL │
                           └─────────────┘
```

## Security Considerations

- Database is isolated in an internal network (not exposed to the internet)
- Non-root users run inside containers
- API docs disabled in production (`/docs`, `/redoc`, `/openapi.json`)
- CORS is restricted to configured origins only
- Health checks configured for all services
- Use HTTPS in production with a reverse proxy (nginx, Caddy, or cloud load balancer)


# Features
- **Track Job Applications:** Easily add, update, and manage all your job applications in one place.
- **Status Management:** Monitor each application's progress (e.g., Applied, Interview, Offer, Rejected, Ghosted).
- **Statistics & Insights:** Get statistics on your application history, such as success rates with an interactive Sankey diagram.
- **Data Table:** View, sort, and filter your job applications in an interactive table.
- **User Authentication:** Secure sign-up and login with email/password or Google.
- **Password Reset:** Easily reset your password if you forget it.
- **Responsive Design:** Works seamlessly on desktop and mobile devices.
- **Privacy Focused:** Your data is private, i don't sell it, i don't plan on selling it or using it for nefarious purposes. Honestly this is a side-project and i don't intend on making money on this. Read more about how your data is used on [terms of service page](https://www.applitrack.no/terms-of-service)
- **Modern UI:** Clean, user-friendly interface built with Tailwind CSS and shadcn/ui. With light/dark mode theme (dark by default to not flashbang your eyes)
- **Account Management:** Update password or delete your account at any time.