# SEC-004: Next.js security upgrade (16.1.6 → 16.4.6)

Verification evidence for the fix, collected on 2026-11-19 in the local project on branch `nextjs-security-upgrade`, commit `a70e15c`. The PR is not merged.

## The finding

| | |
|---|---|
| ID | SEC-004 |
| Title | Next.js 16.1.6 has critical/high advisories (including request smuggling in rewrites) |
| Severity | Critical |
| Location | `package.json` (`next`), `package-lock.json` |
| Original evidence | `audit-reports/raw/npm-audit.txt`, `audit-reports/raw/npm-audit.json` (dated 2026-11-18) |

`npm audit` reported 38 advisories against `next` 16.1.6: 4 critical, 14 high, 16 moderate and 4 low. It also reported 4 against the `postcss` bundled inside Next and 3 against `sharp`, which Next uses for image optimisation. Several of them affect features this app uses:

- the rewrite in `next.config.ts` (request smuggling in rewrites, and SSRF through rewrites)
- `next/image` with a wildcard remote pattern (image-optimizer SSRF and unbounded disk-cache growth)
- `dangerouslyAllowSVG: true` (RCE through SVGs in the image optimizer)

## The fix

`next` and `eslint-config-next` were bumped from 16.1.6 to 16.4.6, the latest release, still exactly pinned. `package-lock.json` was regenerated with npm. No application code changed. The commit is `a70e15c fix(security): upgrade Next.js to 16.4.6`, and only `package.json` and `package-lock.json` changed.

## Scope of this verification

| Area | Evidence |
|---|---|
| Installed versions | `dependency-versions.txt` |
| Security audit before and after | `npm-audit-before.txt`, `npm-audit-after.txt` |
| TypeScript, ESLint, production build | `typescript-test.txt`, `eslint-test.txt`, `production-build.txt` |
| 69 page-load tests and the rest of the audit suite | `page-load-tests.txt` |
| Rewrite, redirects, images, image proxy, auth, dev server | `manual-regression-checklist.md` |
| Screenshots | `screenshots/` (see below) |
| Verdict, remaining issues, side effects | `final-summary.md` |
| Raw machine output (JSON, logs) | `raw/` |

## How the evidence was produced

- **Real installation.** Commands ran in the actual project (`D:\blockcod\CurrentProject\hashtag-next`) after `npm install`, with `next@16.4.6` and `eslint-config-next@16.4.6` installed (`npm ls`).
- **Copied, not edited.** The `.txt` files contain command output copied verbatim. Each one starts with the exact command, a timestamp and the exit code. Any summary or comparison section is labelled as such and was computed from the raw JSON in `raw/`.
- **Unmodified test files.** `audit-reports/raw/audit.spec.mjs` and `audit-reports/raw/sec003.spec.mjs` ran as they are. Their git blob hashes are recorded in the outputs. They ran against `next start` on port 3107, the specs' own default.
- **Automated "manual" checks.** These were performed by driving Chrome with Playwright and by direct HTTP requests. Screenshots were reviewed afterwards. No person clicked through the site.
- **Real data.** Dev-server checks used the real production API. The API allows browser calls from `http://localhost:3000` only, so the audit suite on port 3107 sees CORS errors, as it did in the original audit.
- **Same-day 16.1.6 baseline.** Before the upgrade, a 16.1.6 build of the same application code (`fa403e3`) was tested the same way on an isolated copy. Those results are in `raw/*16.1.6*` and `screenshots/prod-16.1.6-*`, and are used for before/after comparisons.

## Screenshots

- `dev-*.png`: dev server (`npm run dev`, 16.4.6) with real data. Home, login, signup, the `/send-otp`, `/verify-otp` and `/contact` redirect targets, a product listing, categories, a product page and the gallery.
- `prod-16.4.6-*.png` and `prod-16.1.6-*.png`: production builds of both versions, same pages and viewport, for visual comparison. Pixel results are in `raw/screenshot-comparison.txt`.
