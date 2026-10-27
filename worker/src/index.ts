import { Hono } from "hono";
import { requireAuth } from "./auth";
import type { AppBindings } from "./env";
import { applications } from "./routes/applications";
import { dashboard } from "./routes/dashboard";
import { downloads } from "./routes/downloads";
import { statusFlow } from "./routes/status-flow";

/**
 * One Worker serves the API and the built SPA from the same origin.
 *
 * Static assets are handled by the assets binding (see wrangler.jsonc) and only
 * /api/* is routed here first, so there is no CORS layer and no separate
 * frontend service.
 */
const app = new Hono<AppBindings>();

app.get("/api/health", (c) => c.json({ status: "ok" }));

// Public routes come first: attachment downloads carry a signed query string
// instead of a bearer token (the browser opens that URL in a new tab).
app.route("/", downloads);

// Everything else under /api requires a Clerk session token.
for (const prefix of ["/api/applications", "/api/dashboard", "/api/status-flow"]) {
  app.use(prefix, requireAuth);
  app.use(`${prefix}/*`, requireAuth);
}

app.route("/", applications);
app.route("/", dashboard);
app.route("/", statusFlow);

app.notFound((c) => {
  // Unknown API paths must not fall through to the SPA shell.
  if (c.req.path.startsWith("/api/")) return c.json({ detail: "Not found" }, 404);
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
