# Bhutan Tourism Hub — instructions for Claude

Read this file first in every new chat. Then read `docs/STATUS.md` for where the project stands.

## What this is
- **Bhutan Tourism Hub** — https://bhutantourismhub.com — is an installable web app for Bhutan's tour operators, licensed guides and drivers, and hotels. It's free, with no commission.
- Owner: Ugyen Singye, a tour operator.
- Travellers do not book here. Guest reviews exist only to prove real guests travelled.

## The owner's rules (follow exactly)
1. **Do not break working code.** Cross-check every change for future errors before delivering.
2. **Do not overwhelm users.** Keep screens and wording simple.
3. **Ask when in doubt.** Work collaboratively; ask before guessing.
4. **No double booking of confirmed trips, ever.** The database guards it; never weaken those guards.
5. **No hallucinating.** Check facts against the code, the live database or the web. Ask before onboarding guests onto the platform; that is not a goal for now.
6. **Database changes are paste-ready SQL files** that the owner runs in Supabase → SQL Editor. Claude's own migration attempts get cancelled at approval. After he runs one, verify it with a read-only query.
7. **Never push to GitHub.** `main` deploys the live site. The owner uploads changed files himself through the GitHub website ("Add files via upload").
8. **This repository is public.** Never put secrets (keys, push secret, passwords) in any file here.

## How the code is laid out
- `App.jsx` (repo root, about 1 MB) is almost the whole app, in one file. Bump `const BUILD = "BUILD NN — d Mon"` near line 69 on every change; it shows on the welcome screen.
- `src/sw.js` is the service worker (offline, push, update prompt). `vite.config.js` uses vite-plugin-pwa injectManifest.
- `public/` holds static pages and assets:
  - Search pages: `guides.html`, `demo.html`, `hire-guides-drivers.html`, `tour-operators.html`, `hotels.html`, `vip-travel-bhutan.html`, `bhutan-travel-guide.html`.
  - `sitemap.xml`, `robots.txt`, `llms.txt`, icons.
- Stack: React 18, Vite 6, Tailwind 3 (scans only `./index.html` and `./*.{js,jsx}`), Supabase JS 2.
- Deploy: Cloudflare Workers static assets from `./dist`, with SPA fallback (`wrangler.jsonc`), built automatically from `main`.
  - Cloudflare serves `/x.html` at `/x`, so links, canonicals and the sitemap use addresses **without** `.html`.
  - `docs/` and `tools/` are not part of the build or the website.

## Supabase
- Project id `nxnsdnayzimzfiwjrkvv` (ap-northeast-2).
- Before changing anything on the database side, read the live definitions with read-only SQL. Don't trust old files.
- What each SQL file did, and whether it's applied: `docs/database/README.md`.
- Push notifications: `docs/notifications/README.md`.

## How to make a change safely
1. Get the current code: clone `ugensinge8-jpg/guides-driverhub` and check `App.jsx`'s BUILD line matches `docs/STATUS.md`.
2. Change `App.jsx` with small exact-text replacements (a Python script that asserts each anchor appears exactly once), not by retyping large parts.
3. Run the tests (`tools/tests/README.md`): `tools/tests/build.sh v1`, then every `tools/tests/t_*.py`. All must pass. Add a test file for each new feature.
4. Look at the screenshots in `tools/tests/shots/` at phone width (390 px): no sideways scrolling.
5. Deliver a zip with only the changed files, and say exactly where each goes (repo root, `public/`, `src/`). Deliver any SQL as its own file, with steps to run it.
6. Update `docs/STATUS.md` (and `docs/database/README.md` for SQL) in the same delivery.
