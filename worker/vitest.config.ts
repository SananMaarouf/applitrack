import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Migrations are handed to the Worker as an extra binding so the setup file can
// apply them to the local D1 instance before the first test runs.
const migrations = await readD1Migrations("./migrations");

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: migrations,
          // Bypass live Clerk verification in tests; tokens are static strings.
          CLERK_TEST_MODE: "1",
          ATTACHMENT_SIGNING_KEY: "test-signing-key",
          APP_ORIGIN: "http://example.com",
        },
      },
    }),
  ],
  test: {
    setupFiles: ["./test/apply-migrations.ts"],
    globalSetup: ["./test/global-setup.ts"],
  },
});
