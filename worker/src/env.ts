/**
 * Bindings available to the Worker.
 *
 * DB, ATTACHMENTS, ASSETS and APP_ORIGIN come from wrangler.jsonc and are
 * generated into worker-configuration.d.ts by `npm run types`; secrets and the
 * test-only switches are declared in ../bindings.d.ts.
 */
export type Env = Cloudflare.Env;

export type AppBindings = { Bindings: Env; Variables: { userId: string } };
