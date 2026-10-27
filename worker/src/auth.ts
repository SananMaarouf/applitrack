import { createClerkClient } from "@clerk/backend";
import type { Context, Next } from "hono";
import type { AppBindings, Env } from "./env";

type ClerkClient = ReturnType<typeof createClerkClient>;

let cachedClient: { secretKey: string; client: ClerkClient } | null = null;

function getClerkClient(env: Env): ClerkClient | null {
  const secretKey = env.CLERK_SECRET_KEY;
  const publishableKey = env.CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) return null;

  if (cachedClient?.secretKey === secretKey) return cachedClient.client;

  const client = createClerkClient({ secretKey, publishableKey, jwtKey: env.CLERK_JWT_KEY });
  cachedClient = { secretKey, client };
  return client;
}

/**
 * Resolve the authenticated Clerk user id, or null when the request is not
 * signed in.
 *
 * With CLERK_JWT_KEY set the token is verified locally (no call to Clerk's
 * Backend API), and authorizedParties rejects tokens minted for another origin.
 */
export async function resolveUserId(request: Request, env: Env): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;

  const token = header.slice("bearer ".length).trim();
  if (!token) return null;

  // Tests never reach Clerk; the tokens are static identities. Same contract as
  // ENVIRONMENT=testing in the FastAPI backend.
  if (env.CLERK_TEST_MODE === "1") {
    if (token === "user-a-token") return "user_a";
    if (token === "user-b-token") return "user_b";
    return "test_user";
  }

  const clerk = getClerkClient(env);
  if (!clerk) {
    console.error("Clerk is not configured: CLERK_SECRET_KEY / CLERK_PUBLISHABLE_KEY missing");
    return null;
  }

  try {
    // APP_ORIGIN may list several browser origins (apex + www), comma separated.
    const authorizedParties = env.APP_ORIGIN
      ? env.APP_ORIGIN.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
      : undefined;
    const state = await clerk.authenticateRequest(request, { authorizedParties });

    if (!state.isAuthenticated) {
      console.warn(`Clerk authentication failed: ${state.reason}`);
      return null;
    }

    return state.toAuth().userId ?? null;
  } catch (error) {
    console.error("Unexpected error during Clerk authentication", error);
    return null;
  }
}

/** Hono middleware: reject anything without a valid bearer token. */
export async function requireAuth(c: Context<AppBindings>, next: Next): Promise<Response | void> {
  if (c.req.method === "GET" && c.req.path === "/api/health") return next();

  const userId = await resolveUserId(c.req.raw, c.env);
  if (!userId) return c.json({ detail: "Invalid or expired token" }, 401);

  c.set("userId", userId);
  await next();
}
