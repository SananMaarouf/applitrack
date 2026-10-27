# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to keep
the `frontend` and `worker` package versions consistent and generate changelogs
automatically, instead of hand-bumping `package.json` after a big change.

## Making a change that should ship a new version

When you open a PR that changes behaviour in `frontend/` and/or `worker/`, run:

```bash
npx changeset
```

This asks which package(s) changed, whether it's a `patch`/`minor`/`major` bump,
and a one-line summary for the changelog. It writes a small markdown file under
`.changeset/` — commit that file alongside your code changes.

Guidelines for picking the bump type:

- **patch** — bug fix, internal refactor, dependency bump with no behaviour change
- **minor** — new feature, non-breaking API/UI change
- **major** — breaking change (e.g. removed/renamed API field, changed DB backend,
  incompatible config format)

If your PR doesn't warrant a version bump (docs, CI, tests only), no changeset is
needed.

## What happens next

A GitHub Action (`.github/workflows/release.yml`) watches `master` for changeset
files. When one merges, it opens (or updates) a "Version Packages" PR that bumps
the package versions, writes the changelog entries and deletes the consumed
`.changeset/*.md` files.

Both packages are `private`, so nothing is published to npm — the version number
is only a marker of what is deployed.
