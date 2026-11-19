# Next.js security verification: audit report

**Project:** hashtag-next · **Branch:** `nextjs-security-upgrade` @ `4c3565a` (implementation commit `a70e15c`) · **Run:** 2026-11-19_1429 · **Generated:** 2026-11-19T09:31:46.068Z

## 1. Scope and method

The audit verified the security fixes for the Next.js 16.1.6 advisories, including HTTP request smuggling in rewrites (GHSA-ggv3-7p47-pfv8), on the actual project. No application code, dependencies, branches or commits were changed. The following were done:

- **Inventory.** Installed and bundled versions, `package.json` and `package-lock.json`, rewrites, redirects, middleware, route handlers and custom proxy code.
- **Advisory check.** Every reviewed advisory in the GitHub advisory database for next and the React packages (109) was evaluated against the original and installed versions. Each of the 38 that affected 16.1.6 was then reviewed for exposure in this app.
- **Dependency scan.** `npm audit` (all dependencies and production only) and the full installed tree.
- **Build checks.** Production build, TypeScript, ESLint, and the existing regression suites (69 page loads plus functional/security checks, and the authentication suite).
- **Smuggling harness.** A controlled 127.0.0.1-only harness reproduced GHSA-ggv3-7p47-pfv8 on next 16.1.6 and verified the fix on 16.4.6.
- **Raw request tests.** 23 raw HTTP tests against the real production build: DELETE/OPTIONS handling, Transfer-Encoding / Content-Length conflicts, smuggling payloads and pipelining.
- **Backend authorization.** A static map of all 262 backend routes to their auth guards, plus live checks that protected endpoints reject missing or invalid tokens. These were plain GETs only; no malformed or state-changing requests went to production.

## 2. Before and after

| | Before | After |
|---|---|---|
| next | 16.1.6 | **16.4.6** |
| eslint-config-next | 16.1.6 | 16.4.6 |
| sharp (Next image optimizer) | 0.34.5 | 0.35.5 |
| postcss (inside next) | 8.4.31 | 8.5.23 |
| React bundled by Next | 19.3.0-canary-f93b9fd4-20251217 | 19.3.0-canary-278794d7-20261002 |
| react / react-dom (app) | 19.2.3 | 19.2.3 |
| External-rewrite proxy library | http-proxy (vendored) | httpxy |
| Next.js advisories affecting the installed version | 38 | **0** |

**Files changed to fix the issue:** only `package.json` and `package-lock.json`, in commit `a70e15c` (`fix(security): upgrade Next.js to 16.4.6`). Verification evidence was committed separately in `4c3565a`. No application code was changed for the security fix.

## 3. Findings

### 3.1 Next.js and React advisories: FIXED

All 38 advisories that affected next 16.1.6 no longer apply to 16.4.6. By severity: 4 critical, 14 high, 16 medium, 4 low.

- **VERIFIED (2):** GHSA-ggv3-7p47-pfv8 by behavioural test; GHSA-2464-fhr4-w9xw by the advisory's own remediation condition (sharp ≥ 0.35.5).
- **PARTIALLY VERIFIED (1):** GHSA-3x4c-7xq6-9pq8. The bounded image disk cache was confirmed in the installed code but not load-tested.
- **FIXED, version-verified (35):** the installed version is outside the affected range and `npm audit` no longer reports them. They were not individually exploit-tested.
- **NOT APPLICABLE (71):** the other advisories in the database never affected these versions.

8 of the 38 were reachable through features this app uses on 16.1.6 (image optimization, Server Components): GHSA-2464-fhr4-w9xw, GHSA-cjq9-62q9-8jv4, GHSA-2xp9-vwfh-vxw4, GHSA-q8wf-6r8g-63ch, GHSA-h64f-5h5j-jqjh, GHSA-8h8q-6873-q5fj, GHSA-q4gf-8mx6-v5v3, GHSA-3x4c-7xq6-9pq8. Most of the rest were not reachable at all, because the app uses no middleware, Server Actions, `use cache`, Pages Router, i18n or external rewrites. A few depend on hosting (Windows hosts, shared caches or CDNs, the built-in server) or affect developer machines only. The full list is in VULNERABILITY-CHECKLIST.md.

### 3.2 HTTP request smuggling in rewrites: FIXED, VERIFIED; not reachable in this app

The harness reproduced the vulnerable behaviour on 16.1.6: the backend's socket received a hidden `GET /internal-admin-…` as a separate HTTP message after `content-length: 0`. On 16.4.6 the same payload stays correctly framed inside the chunked body. The real app has no external rewrite, so it was not exposed even on 16.1.6. Its server rejects all 11 framing-conflict cases with 400. Details are in REQUEST-SMUGGLING-VERIFICATION.md.

### 3.3 DELETE / OPTIONS handling: PASS, with one robustness note

Pages and API routes return 405 or 204 correctly. Non-GET requests to `public/` static files return 500 instead of 405. That is pre-existing Next.js behaviour, identical in 16.1.6, and not a security vulnerability.

### 3.4 Authentication and authorization on backend routes: PASS, with 2 tests BLOCKED

- **Route guards:** 262 routes mapped. All user-data endpoints the shop calls are JWT-guarded, and admin routes use `requireAdmin`.
- **Live checks:** 10 protected endpoints returned 401 for both a missing and an invalid token.
- **Webhooks:** ShipStation verifies an RSA signature. Square and PayPal re-fetch the payment from the provider rather than trusting the event.
- **BLOCKED:** cross-user access (IDOR) and customer-to-admin escalation could not be tested without real accounts.

### 3.5 Remaining dependency vulnerabilities (not Next.js): NOT FIXED

`npm audit` reports 30 packages: 1 critical, 14 high, 14 moderate, 1 low. In production dependencies alone there are 7: 0 critical, 6 high, 1 low.

| Package | Severity | Production? | Fix | Owner |
|---|---|---|---|---|
| @imgly/background-removal | high | yes (direct) | @imgly/background-removal@1.1.5 (semver-major) | SEC-005 |
| axios | high | yes (direct) | yes (semver-compatible) | SEC-005 |
| dompurify | low | yes (direct) | yes (semver-compatible) | SEC-005 |
| follow-redirects | high | yes | yes (semver-compatible) | SEC-005 |
| nanoid | high | yes | yes (semver-compatible) | lock-only bump (used by postcss) |
| source-map-js | high | yes | yes (semver-compatible) | lock-only bump (used by postcss) |
| zod | high | yes (direct) | @imgly/background-removal@1.1.5 (semver-major) | SEC-005 |
| 23 other packages (incl. the 1 critical, `proxy-addr`) | moderate, high, critical | no (dev tooling: shadcn CLI, typescript-eslint, …) | mostly semver-compatible | dev tooling clean-up |

`nanoid` and `source-map-js` are used by Next's (and Tailwind's) `postcss`. `npm audit` does not attribute them to next, and lock-only patch bumps fix them. Full details are in DEPENDENCY-AUDIT.json.

### 3.6 Other risks found during the audit (not Next.js advisories)

| Risk | Severity | Status |
|---|---|---|
| Image proxy SSRF: IPv6 / IPv4-mapped / DNS names bypass `isBlockedHost` (audit S-004/6/7) | High | NOT FIXED (open finding SEC-001) |
| Image proxy follows redirects without re-checking the target host | High (part of SEC-001) | NOT FIXED |
| Image proxy reads the whole upstream response into memory (no size cap) | Low | NOT FIXED |
| No security response headers (CSP, X-Frame-Options, HSTS, nosniff, Referrer-Policy) and `x-powered-by: Next.js` sent (audit S-010) | Medium | NOT FIXED (existing finding) |
| Square / PayPal webhooks have no signature check (mitigated by re-fetching from the provider) | Low | Accepted mitigation |
| Image disk cache bound defaults to 50% of free disk | Low | Consider an explicit `images.maximumDiskCacheSize` |
| 500 instead of 405 for non-GET on static files | Low | Pre-existing Next.js behaviour |

## 4. Current security status

- **Next.js / React advisories:** none affect the installed versions. Of 109 checked, 0 apply.
- **Request smuggling in rewrites:** fixed and verified; not reachable in this app's configuration.
- **Project overall:** not vulnerability-free. 30 non-Next packages still have advisories, 7 of them in production dependencies, and the image-proxy SSRF finding (SEC-001) and missing security headers remain open.

## 5. Notes on the environment

- **Deleted files:** at about 14:25, before this audit started, the untracked audit reports, the spec files in `audit-reports/raw/` and `AGENTS.md` were deleted from the working tree (consistent with `git clean -f`). This audit did not restore them. It used preserved copies of the two specs, whose provenance is proven by hash.
- **Committed evidence unaffected:** the SEC-004 evidence (`audit-reports/SEC-004/`) is committed and unaffected.
