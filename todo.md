# Domain migration: `applitrack.no` → `applitrack.sanan.no`

The `applitrack.no` registration has lapsed. The app now lives at **`applitrack.sanan.no`**
with the backend at **`applitrack-api.sanan.no`**. The old domain is gone, so no 301 redirects
are possible — the goal is to make the new domain fully authoritative and remove every
dependency on the dead one.

**A repo-wide sweep found no remaining `applitrack.no` string in any tracked file.** Commit
`fd9f8ea` already fixed the last one (the sitemap line in `frontend/public/robots.txt`).
Everything else that resolves to a domain does so through environment variables or external
dashboards that are not in version control:

| Domain-dependent thing | Where it is actually set |
|---|---|
| Frontend → backend base URL | `VITE_API_URL` build arg — consumed at `frontend/src/lib/api.ts:1`, declared in `frontend/Dockerfile:16-23` |
| Backend CORS allowlist | `CORS_ORIGINS` env — `backend/app/core/config.py:10`, split in `backend/app/main.py:47` |
| Clerk authorized parties (`azp`) | **derived from `CORS_ORIGINS`** — `backend/app/core/auth.py:60-64` |
| Clerk keys / instance domain | Clerk dashboard + `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| R2 attachment access | presigned URLs off the account endpoint — `backend/app/core/storage.py:18` |
| Deploy hooks / CF Access | GitHub secrets used by `.github/workflows/trigger-deployment.yml` |

So most of the work is **outside** the codebase.

---

## 1. Critical path — the app stays broken until these are done

- [ ] **Dokploy frontend service**: set build arg `VITE_API_URL=https://applitrack-api.sanan.no`.

  This is a *build-time* Vite variable baked into the JS bundle (`frontend/Dockerfile:16`,
  read at `frontend/src/lib/api.ts:1`). Changing it requires a **rebuild + redeploy** —
  restarting the container does nothing. If the value is missing at build time the bundle
  silently falls back to `http://localhost:8000`, which looks like a CORS failure in
  production but is really a bad base URL.

- [ ] **Dokploy backend service**: set `CORS_ORIGINS=https://applitrack.sanan.no`
      and remove any `applitrack.no` entries.

  ⚠️ **Read this one carefully.** `CORS_ORIGINS` is not just CORS. `backend/app/core/auth.py:60-64`
  reuses the same list as Clerk's `authorized_parties`, so the variable gates authentication too:
  - Old origin left in the list → tokens minted for the new domain fail the `azp` check and
    every request 401s, with no CORS error to point at the cause.
  - New origin missing → login is broken outright.
  - Note the list is *empty-checked*: if `CORS_ORIGINS` ends up blank, `auth.py:68-72` skips the
    `azp` check entirely rather than rejecting everything. That fails open — don't rely on it.

- [ ] **Dokploy domains**: point the frontend service at `applitrack.sanan.no` and the backend
      service at `applitrack-api.sanan.no`. Issue and verify TLS certs for both.

- [ ] **DNS**: add the two records under `sanan.no`. Delete any records still pointing at
      `applitrack.no`.

---

## 2. Clerk — highest-risk unknown

- [ ] **First, determine the instance type.** Open the Clerk dashboard and check whether this is a
      **production** instance (bound to a domain) or a **development** one (not domain-bound).
      Everything below depends on the answer.

- [ ] **If production** — change the instance's **Home URL / primary domain** to
      `applitrack.sanan.no`, then create the CNAME records Clerk generates (`clerk.`, `accounts.`,
      `clkmail.`, plus the two DKIM records) under the new domain. The old `applitrack.no` CNAMEs
      are unreachable now, so these must be recreated from scratch — Clerk will not verify the
      instance until they resolve.

- [ ] **If the publishable/secret keys change** as a result, update `VITE_CLERK_PUBLISHABLE_KEY`
      (frontend build arg — needs a rebuild) and `CLERK_SECRET_KEY` (backend env).

- [ ] Update **allowed redirect URLs / origins** in the Clerk dashboard to the new domain.

- [ ] No change needed for the path-based vars: `VITE_CLERK_SIGN_IN_URL=/sign-in`,
      `VITE_CLERK_SIGN_UP_URL=/sign-up`, and the two fallback redirect URLs are all relative
      paths (`frontend/Dockerfile:18-21`), so they survive the move untouched.

---

## 3. Other external services

- [ ] **Cloudflare R2** — no action expected. `backend/app/core/storage.py:18` builds the endpoint
      from `r2_account_id` (`https://<account>.r2.cloudflarestorage.com`) and serves attachments
      via presigned URLs, so it is domain-independent. Only act if a custom domain was ever
      attached to the bucket — then re-point it under `sanan.no`.

- [ ] **Cloudflare Access** — `.github/workflows/trigger-deployment.yml` authenticates to Dokploy
      through CF Access service tokens. If the Dokploy panel hostname itself lived under
      `applitrack.no`, update the `DOKPLOY_BACKEND_DEPLOY_HOOK_URL` and
      `DOKPLOY_FRONTEND_DEPLOY_HOOK_URL` GitHub secrets, plus the CF Access application hostname
      and its policy. (The workflow's 403 branch prints Cloudflare-vs-Dokploy diagnostics — useful
      if this breaks.)

- [ ] **Google Search Console** — the old property is dead. Add `applitrack.sanan.no` as a new
      property and verify it. Do not expect to carry over authority: with the domain expired and
      no 301s possible, the old rankings and backlinks are lost. Treat this as a fresh property.

---

## 4. In-repo cleanups (small, low risk)

- [ ] **`frontend/public/robots.txt` advertises a sitemap that does not exist.** Line 15 reads
      `Sitemap: https://applitrack.sanan.no/sitemap.xml`, but there is no `sitemap.xml` in
      `frontend/public/`. Either add a static one covering `/` and `/terms-of-service` (the only
      two public routes — everything else in the file is `Disallow`ed) or drop the `Sitemap:` line.

- [ ] **Typo in the same file, line 3**: `Allow /terms-of-service` is missing its colon and is
      silently ignored by crawlers. Should be `Allow: /terms-of-service`.

- [ ] **`frontend/index.html` has no SEO metadata** — just a `<title>`. A domain move is the
      natural moment to add `<link rel="canonical" href="https://applitrack.sanan.no/">` plus
      `og:url`, `og:title`, `og:description`, and `og:image` so shared links render correctly on
      the new domain and nothing points at the dead one.

- [ ] *(Optional)* Add a "Live at https://applitrack.sanan.no" line to `README.md`, which
      currently never mentions where the app is hosted.

### Verified domain-free — leave alone

`docker-compose.yml` (local dev, container names only) · `frontend/nginx.conf`
(`server_name localhost`, correct behind a reverse proxy) · `backend/.env.test.example`
(localhost origins for CI) · all four `.github/workflows/*.yml` (no hardcoded app domain).

---

## 5. Verification after cutover

1. `curl -sI https://applitrack.sanan.no` → 200, valid cert.
2. `curl -sI https://applitrack-api.sanan.no/health` → 200 `{"status":"ok"}`.
3. CORS preflight against the real origin:
   ```bash
   curl -si -X OPTIONS https://applitrack-api.sanan.no/applications \
     -H 'Origin: https://applitrack.sanan.no' \
     -H 'Access-Control-Request-Method: GET'
   ```
   Expect `access-control-allow-origin: https://applitrack.sanan.no`.
4. **The one that matters most** — in a browser: sign in via Clerk on the new domain, load
   `/dashboard`, create an application, upload a PDF attachment, and open the presigned download
   link. This exercises the Clerk `azp` check, CORS, and R2 in a single pass.
5. `curl -s https://applitrack.sanan.no/robots.txt` → sitemap line matches whatever was decided
   in section 4.
6. Local regression before any deploy (unaffected by the domain, but cheap):
   `cd frontend && npm test` and `cd backend && pytest`.
