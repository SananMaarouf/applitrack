# Applitrack

A job application tracker designed to help you stay organized during your job search. It keeps a record of the positions you've applied to, the companies, and your progress through each application process.

In addition to tracking, Applitrack provides insightful statistics about your job hunt, visualized through an informative Sankey diagram.

![Applitrack UI](https://raw.githubusercontent.com/SananMaarouf/applitrack/master/applitrack.png)


# Stack
- [Vite + React](https://vitejs.dev/)
- [TanStack Router](https://tanstack.com/router)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://zod.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Clerk](https://clerk.com/)
- [SQLite](https://www.sqlite.org/)

# Features
- **Track Job Applications:** Easily add, update, and manage all your job applications in one place.
- **Status Management:** Monitor each application's progress (e.g., Applied, Interview, Offer, Rejected, Ghosted).
- **Statistics & Insights:** Get statistics on your application history, such as success rates with an interactive Sankey diagram.
- **Data Table:** View, sort, and filter your job applications in an interactive table.
- **Responsive Design:** Works seamlessly on desktop and mobile devices.
- **Modern UI:** Clean, user-friendly interface built with Tailwind CSS and shadcn/ui. With light/dark mode theme (dark by default to not flashbang your eyes)
- **Account Management:** Update password or delete your account at any time.

# Deploying with Dokploy

CI builds and pushes `applitrack-backend` and `applitrack-frontend` images to Docker Hub on every push to `master` (see `.github/workflows/docker-build-push.yml`). Dokploy runs these as two separate services pointed at the published images.

## Backend service
1. Create a new **Application** in Dokploy using the Docker provider, image `<DOCKERHUB_USERNAME>/applitrack-backend:latest`.
2. Add a **volume** mounted at `/app/data` so the SQLite database (`applitrack.db`) survives redeploys.
3. Expose port `8000` and set the domain/proxy for your API host.
4. Set environment variables: `DATABASE_URL` (`sqlite+aiosqlite:////app/data/applitrack.db`), `CLERK_SECRET_KEY`, `CORS_ORIGINS`, `ENVIRONMENT=production`, and the `R2_*` variables if attachments are enabled.
5. Under **Deployments**, copy the generated deploy webhook URL into the `DOKPLOY_BACKEND_DEPLOY_HOOK_URL` GitHub secret so CI can trigger a redeploy after a successful image push.

## Frontend service
1. Create a second Application using image `<DOCKERHUB_USERNAME>/applitrack-frontend:latest`.
2. Expose port `80` (nginx) and set the domain for your site.
3. The `VITE_*` variables (`VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, sign-in/sign-up URLs) are baked in at build time, so they must be passed as Docker build args if you rebuild the image yourself; the CI-built image already has them set from repo secrets.
4. Copy the frontend deploy webhook URL into `DOKPLOY_FRONTEND_DEPLOY_HOOK_URL`.

## Triggering redeploys
The `DOKPLOY_BACKEND_DEPLOY_HOOK_URL` and `DOKPLOY_FRONTEND_DEPLOY_HOOK_URL` secrets let a workflow step `curl` the Dokploy webhook after a new image is pushed, so each service picks up the `latest` tag automatically. See `.env.example` for the full list of variables Dokploy needs to inject per service.

## Database migrations
Run Alembic migrations against the deployed SQLite volume before or after rollout, e.g. via Dokploy's one-off command/terminal on the backend service:
```
uv run alembic upgrade head
```