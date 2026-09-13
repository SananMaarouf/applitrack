# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to version `frontend` and `backend` independently and generate changelogs automatically, instead of someone remembering to hand-bump `frontend/package.json` and `backend/pyproject.toml` after a big change.

## Making a change that should ship a new version

When you open a PR that changes behavior in `frontend/` and/or `backend/`, run:

```bash
npx changeset
```

This asks which package(s) changed, whether it's a `patch`/`minor`/`major` bump, and a one-line summary for the changelog. It writes a small markdown file under `.changeset/` — commit that file alongside your code changes.

Guidelines for picking the bump type:

- **patch** — bug fix, internal refactor, dependency bump with no behavior change
- **minor** — new feature, non-breaking API/UI change
- **major** — breaking change (e.g. removed/renamed API field, changed DB backend, incompatible config format)

If your PR doesn't warrant a version bump (docs, CI, tests only), no changeset is needed.

## What happens next

A GitHub Action (`.github/workflows/release.yml`) watches `master` for changeset files. When one merges, it opens (or updates) a "Version Packages" PR that:

1. Bumps `frontend/package.json` and/or `backend/package.json` (and, via `scripts/sync-backend-version.mjs`, the mirrored `version` in `backend/pyproject.toml`)
2. Writes the changelog entries
3. Deletes the consumed `.changeset/*.md` files

Merging that PR is the actual release point — CI/Docker builds trigger from `master` as usual.

Backend note: `backend/package.json` is not a real Node package — it exists only so Changesets (a JS-ecosystem tool) can track and bump the backend's version number the same way it does for the frontend. The source of truth for the backend's version at runtime is `backend/pyproject.toml`; the sync script keeps the two in lockstep.
