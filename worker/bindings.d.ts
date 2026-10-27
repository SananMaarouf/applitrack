import type { D1Migration } from "@cloudflare/vitest-plugin";

/**
 * Bindings that are not declared in wrangler.jsonc.
 *
 * Kept in a hand-written file so `wrangler types` can regenerate
 * worker-configuration.d.ts (DB, ATTACHMENTS, ASSETS, APP_ORIGIN) without
 * wiping these declarations. Secrets are set with `wrangler secret put`.
 */
declare global {
  namespace Cloudflare {
    interface Env {
      /** Clerk secret key (Backend API). */
      CLERK_SECRET_KEY?: string;
      /** Clerk publishable key; required by authenticateRequest(). */
      CLERK_PUBLISHABLE_KEY?: string;
      /** Clerk PEM public key, so tokens are verified without a Clerk round-trip. */
      CLERK_JWT_KEY?: string;
      /** HMAC key for the short-lived attachment download URLs. */
      ATTACHMENT_SIGNING_KEY?: string;
      /** "1" in tests only: static bearer tokens, no Clerk call. */
      CLERK_TEST_MODE?: string;
      /** Test-only: migrations handed over by vitest.config.ts. */
      TEST_MIGRATIONS?: D1Migration[];
    }
  }
}

export {};
