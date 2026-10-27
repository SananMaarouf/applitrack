import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Miniflare refuses to start when the configured assets directory is missing,
 * and `frontend/dist` is a build artifact. Create a placeholder so the API
 * suite can run without a full frontend build first.
 */
export default function setup(): void {
  const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../../frontend/dist");
  if (existsSync(dist)) return;
  mkdirSync(dist, { recursive: true });
  writeFileSync(`${dist}/index.html`, "<!doctype html><title>applitrack</title>\n");
}
