#!/usr/bin/env node
// Mirrors backend/package.json's version (bumped by `changeset version`) into
// backend/pyproject.toml, which is the real manifest read at runtime/build time.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const backendPackageJsonPath = path.join(rootDir, "backend", "package.json");
const pyprojectPath = path.join(rootDir, "backend", "pyproject.toml");

const { version } = JSON.parse(readFileSync(backendPackageJsonPath, "utf8"));
const pyproject = readFileSync(pyprojectPath, "utf8");

const versionLine = /^version = "[^"]*"$/m;
if (!versionLine.test(pyproject)) {
  throw new Error(`Could not find a 'version = "..."' line in ${pyprojectPath}`);
}

writeFileSync(pyprojectPath, pyproject.replace(versionLine, `version = "${version}"`));
console.log(`Synced backend/pyproject.toml version -> ${version}`);
