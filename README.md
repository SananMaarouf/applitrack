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

## Run everything with Docker

Starts PostgreSQL, the FastAPI backend, and the Vite + TanStack Router frontend:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000 (health: http://localhost:8000/health)
- Postgres: localhost:5432

## Auth note

The FastAPI backend currently expects a temporary `X-User-Id` header so you can develop the API + UI quickly.
This is intended to be replaced with proper Clerk JWT verification.


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