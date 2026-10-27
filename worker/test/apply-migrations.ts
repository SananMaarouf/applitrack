import { applyD1Migrations, env } from "cloudflare:test";

// Idempotent: applied migrations are recorded in the d1_migrations table.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS ?? []);
