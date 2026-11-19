# Test results

**Project:** hashtag-next · **Branch:** `nextjs-security-upgrade` @ `4c3565a` (implementation commit `a70e15c`) · **Run:** 2026-11-19_1429 · **Generated:** 2026-11-19T09:31:46.068Z

**105 tests:** 85 PASS · 14 FAIL · 6 BLOCKED

How to read the smuggling-harness rows: the 16.1.6 rows are a deliberate before-picture. A FAIL there means the vulnerability reproduced, which is the expected result for the old version. The 16.4.6 rows are the ones that verify the fix.

## Dependencies (10)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| DEP-01 | Installed Next.js and React versions | npm ls next react react-dom; read node_modules/*/package.json | next 16.4.6, react 19.2.3, react-dom 19.2.3, eslint-config-next 16.4.6, bundled React 19.3.0-canary-278794d7-20261002 | **PASS** | [versions.txt](evidence/01-inventory/versions.txt) |
| DEP-02 | Next.js-related packages absent from npm audit | npm audit --json | next, postcss, sharp, react, react-dom: not listed (30 other packages listed) | **PASS** | [npm-audit.json](evidence/02-dependency-scan/npm-audit.json) |
| DEP-03 | Whole-project npm audit clean | npm audit | 30 vulnerable packages: 1 critical, 14 high, 14 moderate, 1 low (none are Next.js/React) | **FAIL** | [npm-audit.txt](evidence/02-dependency-scan/npm-audit.txt) |
| DEP-04 | Production dependencies free of high/critical advisories | npm audit --omit=dev | 7 vulnerable packages: 0 critical, 6 high, 1 low | **FAIL** | [npm-audit-omit-dev.txt](evidence/02-dependency-scan/npm-audit-omit-dev.txt) |
| DEP-05 | Complete GitHub advisory database checked against installed versions | GET api.github.com/advisories?ecosystem=npm&affects=<pkg> (6 packages); semver evaluation | 109 advisories checked (79 next, 30 React); 0 affect the installed versions; 38 affected 16.1.6 | **PASS** | [advisory-eval.json](evidence/03-advisory-database/advisory-eval.json) |
| DEP-06 | GHSA-ggv3-7p47-pfv8 patched version installed | semver: 16.4.6 vs >= 16.0.0-beta.0 < 16.1.7 | 16.4.6 is outside the affected range (patched in 16.1.7) | **PASS** | [GHSA-ggv3-7p47-pfv8.json](evidence/03-advisory-database/GHSA-ggv3-7p47-pfv8.json) |
| DEP-07 | Bundled React (RSC) not affected | grep version from next/dist/compiled/react; compare React and Next advisories | Bundled 19.3.0-canary-278794d7-20261002; React RSC advisories map to Next advisories that are all patched at or below 16.4.1 | **PASS** | [versions.txt](evidence/01-inventory/versions.txt) |
| DEP-08 | sharp >= 0.35.5 (GHSA-2464-fhr4-w9xw remediation) | npm ls sharp | sharp 0.35.5 | **PASS** | [fix-code-presence.txt](evidence/01-inventory/fix-code-presence.txt) |
| DEP-09 | External-rewrite proxy library replaced | ls node_modules/next/dist/compiled | 16.1.6 vendored http-proxy; 16.4.6 uses httpxy | **PASS** | [fix-code-presence.txt](evidence/01-inventory/fix-code-presence.txt) |
| DEP-10 | Image disk cache bounded (GHSA-3x4c-7xq6-9pq8) | read next/dist/esm/server/lib/disk-lru-cache.external.js | 16.4.6 uses an LRU bounded at 50% of free disk when maximumDiskCacheSize is unset (option absent in 16.1.6) | **PASS** | [fix-code-presence.txt](evidence/01-inventory/fix-code-presence.txt) |

## Configuration (3)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| CFG-01 | Rewrite destinations are internal only | inspect next.config.ts | 1 rewrite: /favicon.ico -> /favicon.png (same-origin path); no external destination | **PASS** | [feature-usage.txt](evidence/01-inventory/feature-usage.txt) |
| CFG-02 | Middleware / proxy configuration | ls middleware.* proxy.* src/middleware.* src/proxy.* | None present | **PASS** | [feature-usage.txt](evidence/01-inventory/feature-usage.txt) |
| CFG-03 | Custom API proxy forwards no client framing | review src/app/api/proxy-image/route.ts; find src/app -name route.* | Only route handler is GET /api/proxy-image; it builds a new GET with a fixed User-Agent and forwards no client method, headers or body. src/app/api/proxy/[...path] is an empty, untracked directory with no handler (not in the build). | **PASS** | [feature-usage.txt](evidence/01-inventory/feature-usage.txt) |

## Build (4)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| BLD-01 | Production build | npm run build | Exit 0; Compiled successfully in 2.5s; 27/27 static pages; 30 routes, same table as SEC-004 | **PASS** | [build.txt](evidence/04-build-typecheck-lint/build.txt) |
| BLD-02 | TypeScript | npx tsc --noEmit | Exit 0, no type errors | **PASS** | [tsc.txt](evidence/04-build-typecheck-lint/tsc.txt) |
| BLD-03 | ESLint | npx eslint src | Exit 0; ✖ 1 problem (0 errors, 1 warning) (new rule no-location-assign-relative-destination at src/errors/ApiErrorHandler.js:48) | **PASS** | [eslint.txt](evidence/04-build-typecheck-lint/eslint.txt) |
| BLD-04 | Unit / integration test runner | inspect package.json scripts | No unit or integration test runner is configured (scripts: dev, build, start, lint; no jest/vitest). The existing browser suites below were run instead. | **BLOCKED** | [feature-usage.txt](evidence/01-inventory/feature-usage.txt) |

## Request smuggling (harness) (18)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| SMG-S1-16.1.6 | DELETE, Transfer-Encoding: chunked, body = a complete second request (advisory scenario) [next 16.1.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 500 Internal Server Error. Backend parsed: DELETE /S1-v16.1.6 (cl=0, te=-, body=0). Smuggled request bytes arrived on the backend socket as a separate HTTP message after Content-Length: 0. | **FAIL** | [smuggle-16.1.6.json](evidence/05-request-smuggling-harness/smuggle-16.1.6.json) |
| SMG-S2-16.1.6 | OPTIONS, Transfer-Encoding: chunked, body = a complete second request (advisory scenario) [next 16.1.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 500 Internal Server Error. Backend parsed: OPTIONS /S2-v16.1.6 (cl=0, te=-, body=0). Smuggled request bytes arrived on the backend socket as a separate HTTP message after Content-Length: 0. | **FAIL** | [smuggle-16.1.6.json](evidence/05-request-smuggling-harness/smuggle-16.1.6.json) |
| SMG-S3-16.1.6 | POST, Transfer-Encoding: chunked, same body (control: POST is not in the vulnerable code path) [next 16.1.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 200 OK. Backend parsed: POST /S3-v16.1.6 (cl=-, te=chunked, body=60). | **PASS** | [smuggle-16.1.6.json](evidence/05-request-smuggling-harness/smuggle-16.1.6.json) |
| SMG-S4-16.1.6 | DELETE with Content-Length body containing the same text (control: length-framed body) [next 16.1.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 200 OK. Backend parsed: DELETE /S4-v16.1.6 (cl=60, te=-, body=60). | **PASS** | [smuggle-16.1.6.json](evidence/05-request-smuggling-harness/smuggle-16.1.6.json) |
| SMG-S5-16.1.6 | DELETE without a body (baseline) [next 16.1.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 200 OK. Backend parsed: DELETE /S5-v16.1.6 (cl=0, te=-, body=0). | **PASS** | [smuggle-16.1.6.json](evidence/05-request-smuggling-harness/smuggle-16.1.6.json) |
| SMG-S6-16.1.6 | DELETE with BOTH Content-Length and Transfer-Encoding: chunked (CL.TE conflict) [next 16.1.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 400 Bad Request. Backend parsed: nothing (rejected before the proxy). | **PASS** | [smuggle-16.1.6.json](evidence/05-request-smuggling-harness/smuggle-16.1.6.json) |
| SMG-S7-16.1.6 | DELETE with two different Content-Length headers [next 16.1.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 400 Bad Request. Backend parsed: nothing (rejected before the proxy). | **PASS** | [smuggle-16.1.6.json](evidence/05-request-smuggling-harness/smuggle-16.1.6.json) |
| SMG-S8-16.1.6 | OPTIONS with obfuscated header 'Transfer-Encoding : chunked' (space before colon) [next 16.1.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 400 Bad Request. Backend parsed: nothing (rejected before the proxy). | **PASS** | [smuggle-16.1.6.json](evidence/05-request-smuggling-harness/smuggle-16.1.6.json) |
| SMG-S9-16.1.6 | DELETE, Transfer-Encoding: chunked, keep-alive, then a normal GET on the same client connection [next 16.1.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 500 Internal Server Error, HTTP/1.1 200 OK. Backend parsed: GET /S9-v16.1.6-follow (cl=-, te=-, body=0); DELETE /S9-v16.1.6 (cl=0, te=-, body=0). Smuggled request bytes arrived on the backend socket as a separate HTTP message after Content-Length: 0. | **FAIL** | [smuggle-16.1.6.json](evidence/05-request-smuggling-harness/smuggle-16.1.6.json) |
| SMG-S1-16.4.6 | DELETE, Transfer-Encoding: chunked, body = a complete second request (advisory scenario) [next 16.4.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 200 OK. Backend parsed: DELETE /S1-v16.4.6 (cl=-, te=chunked, body=60). | **PASS** | [smuggle-16.4.6.json](evidence/05-request-smuggling-harness/smuggle-16.4.6.json) |
| SMG-S2-16.4.6 | OPTIONS, Transfer-Encoding: chunked, body = a complete second request (advisory scenario) [next 16.4.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 200 OK. Backend parsed: OPTIONS /S2-v16.4.6 (cl=-, te=chunked, body=60). | **PASS** | [smuggle-16.4.6.json](evidence/05-request-smuggling-harness/smuggle-16.4.6.json) |
| SMG-S3-16.4.6 | POST, Transfer-Encoding: chunked, same body (control: POST is not in the vulnerable code path) [next 16.4.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 200 OK. Backend parsed: POST /S3-v16.4.6 (cl=-, te=chunked, body=60). | **PASS** | [smuggle-16.4.6.json](evidence/05-request-smuggling-harness/smuggle-16.4.6.json) |
| SMG-S4-16.4.6 | DELETE with Content-Length body containing the same text (control: length-framed body) [next 16.4.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 200 OK. Backend parsed: DELETE /S4-v16.4.6 (cl=60, te=-, body=60). | **PASS** | [smuggle-16.4.6.json](evidence/05-request-smuggling-harness/smuggle-16.4.6.json) |
| SMG-S5-16.4.6 | DELETE without a body (baseline) [next 16.4.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 200 OK. Backend parsed: DELETE /S5-v16.4.6 (cl=0, te=-, body=0). | **PASS** | [smuggle-16.4.6.json](evidence/05-request-smuggling-harness/smuggle-16.4.6.json) |
| SMG-S6-16.4.6 | DELETE with BOTH Content-Length and Transfer-Encoding: chunked (CL.TE conflict) [next 16.4.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 400 Bad Request. Backend parsed: nothing (rejected before the proxy). | **PASS** | [smuggle-16.4.6.json](evidence/05-request-smuggling-harness/smuggle-16.4.6.json) |
| SMG-S7-16.4.6 | DELETE with two different Content-Length headers [next 16.4.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 400 Bad Request. Backend parsed: nothing (rejected before the proxy). | **PASS** | [smuggle-16.4.6.json](evidence/05-request-smuggling-harness/smuggle-16.4.6.json) |
| SMG-S8-16.4.6 | OPTIONS with obfuscated header 'Transfer-Encoding : chunked' (space before colon) [next 16.4.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 400 Bad Request. Backend parsed: nothing (rejected before the proxy). | **PASS** | [smuggle-16.4.6.json](evidence/05-request-smuggling-harness/smuggle-16.4.6.json) |
| SMG-S9-16.4.6 | DELETE, Transfer-Encoding: chunked, keep-alive, then a normal GET on the same client connection [next 16.4.6] | node smuggle-tests.mjs (raw TCP to 127.0.0.1) | Client: HTTP/1.1 200 OK. Backend parsed: GET /S9-v16.4.6-follow (cl=-, te=-, body=0); DELETE /S9-v16.4.6 (cl=-, te=chunked, body=60). | **PASS** | [smuggle-16.4.6.json](evidence/05-request-smuggling-harness/smuggle-16.4.6.json) |

## Request handling (real app) (23)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| APP-M1 | DELETE on a static page (/login) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 405 Method Not Allowed / Allow: GET. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-M2 | OPTIONS on a static page (/login) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 405 Method Not Allowed / Allow: GET. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-M3 | DELETE on the GET-only route handler (/api/proxy-image) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 405 Method Not Allowed. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-M4 | OPTIONS on the GET-only route handler (/api/proxy-image) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 204 No Content / allow: GET, HEAD, OPTIONS. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-M5 | DELETE on the internal rewrite (/favicon.ico -> /favicon.png) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 500 Internal Server Error / Allow: GET. Expected 405; Next.js answers 500 for non-GET methods on public/ static files (same in 16.1.6; robustness issue, no data exposure). | **FAIL** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-M6 | OPTIONS on the internal rewrite (/favicon.ico) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 500 Internal Server Error / Allow: GET. Expected 405; Next.js answers 500 for non-GET methods on public/ static files (same in 16.1.6; robustness issue, no data exposure). | **FAIL** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-M7 | GET on the internal rewrite (control) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 200 OK. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-R1 | DELETE /favicon.ico, Transfer-Encoding: chunked, body = a second request | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 500 Internal Server Error / Allow: GET. Smuggled probe not processed as a second request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-R2 | OPTIONS /favicon.ico, Transfer-Encoding: chunked, body = a second request | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 500 Internal Server Error / Allow: GET. Smuggled probe not processed as a second request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-R3 | DELETE /api/proxy-image, Transfer-Encoding: chunked, body = a second request | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 405 Method Not Allowed. Smuggled probe not processed as a second request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-R4 | OPTIONS /login, Transfer-Encoding: chunked, body = a second request | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 405 Method Not Allowed / Allow: GET. Smuggled probe not processed as a second request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H1 | Content-Length and Transfer-Encoding: chunked together (CL.TE) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H2 | Transfer-Encoding: chunked then Content-Length (TE.CL order) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H3 | Two different Content-Length headers | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H4 | Obfuscated 'Transfer-Encoding : chunked' (space before colon) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H5 | Transfer-Encoding: xchunked (unknown coding) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H6 | Transfer-Encoding: chunked, chunked (repeated coding) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H7 | Header folding (obs-fold) on Transfer-Encoding | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H8 | Invalid chunk size | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H9 | Bare LF line endings in the request head | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H10 | Negative Content-Length | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-H11 | Content-Length with a plus sign (+5) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 400 Bad Request. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |
| APP-P1 | Two pipelined GET requests (control) | node real-app-request-tests.mjs 3107 (raw TCP to the production build) | HTTP/1.1 200 OK, HTTP/1.1 200 OK. | **PASS** | [real-app-request-tests.json](evidence/06-real-app-request-tests/real-app-request-tests.json) |

## Regression (1)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| REG-PL | 69 page-load tests (23 routes x 3 viewports) | node audit.spec (runnable copy; see spec-provenance.txt) | 69/69 passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |

## Functional regression (15)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| REG-F-001 | Signed-out visitor opening /account is sent to login | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-002 | Signed-out visitor opening /orders sees a login prompt or redirect | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-003 | Signed-out visitor opening /saved sees a login prompt or redirect | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-004 | Signed-out visitor opening /payment-history sees a login prompt or redirect | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-005 | Signed-out visitor opening /checkout sees a login prompt or redirect | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-006 | Signed-out visitor opening /cart sees a login prompt or redirect | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-010 | Login form rejects empty submission client-side | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-011 | Login form rejects malformed email | node audit.spec (runnable copy) | Failed - existing finding (login email validation) | **FAIL** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-012 | Forgot-password form rejects empty email | node audit.spec (runnable copy) | Failed - existing finding (forgot-password validation) | **FAIL** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-013 | Reset-password page without token shows an error state | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-014 | Unknown route returns 404 page | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-015 | Unknown product id handled gracefully | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-016 | Category listing shows products (catalog search/filter base) | node audit.spec (runnable copy) | Blocked - blocked: API CORS allows only http://localhost:3000 | **BLOCKED** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-F-017 | Product detail page renders for first listed product | node audit.spec (runnable copy) | Blocked - blocked: depends on F-016 | **BLOCKED** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-P-001 | Home page weight and load timing (desktop) | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |

## Security regression (9)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| REG-S-001 | Proxy rejects missing url | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-S-002 | Proxy rejects file: scheme | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-S-003 | Proxy rejects 127.0.0.1 | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-S-004 | Proxy rejects IPv6 loopback [::1] | node audit.spec (runnable copy) | Failed - open finding SEC-001 (image proxy SSRF) | **FAIL** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-S-005 | Proxy rejects 169.254.169.254 metadata IP | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-S-006 | Proxy rejects IPv4-mapped IPv6 loopback | node audit.spec (runnable copy) | Failed - open finding SEC-001 (image proxy SSRF) | **FAIL** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-S-007 | Proxy rejects hostname resolving to loopback (localtest.me) | node audit.spec (runnable copy) | Failed - open finding SEC-001 (image proxy SSRF) | **FAIL** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-S-010 | Security response headers present on / | node audit.spec (runnable copy) | Failed - security headers not configured (existing finding) | **FAIL** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |
| REG-S-011 | robots.txt and sitemap.xml served | node audit.spec (runnable copy) | Passed | **PASS** | [audit-suite.json](evidence/07-regression-suites/audit-suite.json) |

## Authentication regression (14)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| AUTH-01 | Signed-out user opening /account is redirected to login with returnTo | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-08a | No redirect loop for signed-out user (stable on login) | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-02a | While the token is being verified, no account content is rendered | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-02 | Signed-in user (valid token) sees the account page | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-02b | Account sections (profile, addresses, graphics, password) still switch | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-06a | Refreshing /account while signed in keeps access | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-03 | Logout on the account page removes access (home, token cleared, /account → login) | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-06b | Refreshing /account while signed out redirects to login | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-03b | Logout in another tab removes access on the open account page | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-04 | Invalid token: access denied, token cleared, sent to login | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-05 | Expired token (jwt expired): logged out and redirected to login | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-05b | Profile check fails with 500: no account shown, sent to login (existing BUG-010 logout path) | node sec003.spec (runnable copy, in-browser API mock) | Failed - by design since BUG-010 (session kept on server errors) | **FAIL** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-08b | Login page with returnTo=/account is stable (no loop back to /account) | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |
| AUTH-09 | Token never appears in URLs or console output | node sec003.spec (runnable copy, in-browser API mock) | Passed | **PASS** | [auth-suite.json](evidence/07-regression-suites/auth-suite.json) |

## Backend authorization (7)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| AZ-01 | Backend routes mapped to auth guards (static) | node backend-route-auth.mjs <hashtag-backend> | 262 routes: 161 admin-guarded, 35 JWT-guarded, 66 public (catalog reads, auth, forms, webhooks; the ShipStation webhook has its own signature middleware) | **PASS** | [backend-route-auth.json](evidence/08-backend-authz/backend-route-auth.json) |
| AZ-02 | Every user-data endpoint the shop calls is guarded on the backend | match src/api/endpoints.ts to backend routes | 21 of 21 user-data endpoints found; every matching backend route is JWT- or admin-guarded | **PASS** | [shop-endpoint-guards.json](evidence/08-backend-authz/shop-endpoint-guards.json) |
| AZ-03 | Protected endpoints reject missing and invalid tokens (live, GET only) | curl GET <endpoint> with no token / x-access-token: invalid | 10 endpoints x 2 = 20 checks: all 401 | **PASS** | [backend-authz-live.txt](evidence/08-backend-authz/backend-authz-live.txt) |
| AZ-04 | ShipStation webhook authenticity | review shipstationWebhook.middleware.js | RSA-SHA256 signature verified (x-shipengine-rsa-sha256-* headers) | **PASS** | [webhook-verification.txt](evidence/08-backend-authz/webhook-verification.txt) |
| AZ-05 | Square / PayPal webhook authenticity | review checkout.service.js | No signature verification; both re-fetch the payment/capture from the provider and act only on its status (forged events cannot mark orders paid) | **PASS** | [webhook-verification.txt](evidence/08-backend-authz/webhook-verification.txt) |
| AZ-06 | Cross-user access (IDOR) on orders, addresses, payments | - | Requires two real customer accounts; none available. Not tested; no requests sent. | **BLOCKED** | — |
| AZ-07 | Customer token cannot reach admin routes | - | Requires a valid customer token; none available. Not tested. | **BLOCKED** | — |

## Environment (1)

| ID | Test | Command | Result | Status | Evidence |
|---|---|---|---|---|---|
| ENV-01 | Production host OS (GHSA-p293-qw3h-jr36 exposure) | - | Hosting details not available to this audit. The advisory is fixed by version either way. | **BLOCKED** | — |

## Failures and blocked tests explained

- **DEP-03 FAIL:** Whole-project npm audit clean. 30 vulnerable packages: 1 critical, 14 high, 14 moderate, 1 low (none are Next.js/React)
- **DEP-04 FAIL:** Production dependencies free of high/critical advisories. 7 vulnerable packages: 0 critical, 6 high, 1 low
- **BLD-04 BLOCKED:** Unit / integration test runner. No unit or integration test runner is configured (scripts: dev, build, start, lint; no jest/vitest). The existing browser suites below were run instead.
- **SMG-S1-16.1.6 FAIL:** DELETE, Transfer-Encoding: chunked, body = a complete second request (advisory scenario) [next 16.1.6]. Client: HTTP/1.1 500 Internal Server Error. Backend parsed: DELETE /S1-v16.1.6 (cl=0, te=-, body=0). Smuggled request bytes arrived on the backend socket as a separate HTTP message after Content-Length: 0.
- **SMG-S2-16.1.6 FAIL:** OPTIONS, Transfer-Encoding: chunked, body = a complete second request (advisory scenario) [next 16.1.6]. Client: HTTP/1.1 500 Internal Server Error. Backend parsed: OPTIONS /S2-v16.1.6 (cl=0, te=-, body=0). Smuggled request bytes arrived on the backend socket as a separate HTTP message after Content-Length: 0.
- **SMG-S9-16.1.6 FAIL:** DELETE, Transfer-Encoding: chunked, keep-alive, then a normal GET on the same client connection [next 16.1.6]. Client: HTTP/1.1 500 Internal Server Error, HTTP/1.1 200 OK. Backend parsed: GET /S9-v16.1.6-follow (cl=-, te=-, body=0); DELETE /S9-v16.1.6 (cl=0, te=-, body=0). Smuggled request bytes arrived on the backend socket as a separate HTTP message after Content-Length: 0.
- **APP-M5 FAIL:** DELETE on the internal rewrite (/favicon.ico -> /favicon.png). HTTP/1.1 500 Internal Server Error / Allow: GET. Expected 405; Next.js answers 500 for non-GET methods on public/ static files (same in 16.1.6; robustness issue, no data exposure).
- **APP-M6 FAIL:** OPTIONS on the internal rewrite (/favicon.ico). HTTP/1.1 500 Internal Server Error / Allow: GET. Expected 405; Next.js answers 500 for non-GET methods on public/ static files (same in 16.1.6; robustness issue, no data exposure).
- **REG-F-011 FAIL:** Login form rejects malformed email. Failed - existing finding (login email validation)
- **REG-F-012 FAIL:** Forgot-password form rejects empty email. Failed - existing finding (forgot-password validation)
- **REG-F-016 BLOCKED:** Category listing shows products (catalog search/filter base). Blocked - blocked: API CORS allows only http://localhost:3000
- **REG-F-017 BLOCKED:** Product detail page renders for first listed product. Blocked - blocked: depends on F-016
- **REG-S-004 FAIL:** Proxy rejects IPv6 loopback [::1]. Failed - open finding SEC-001 (image proxy SSRF)
- **REG-S-006 FAIL:** Proxy rejects IPv4-mapped IPv6 loopback. Failed - open finding SEC-001 (image proxy SSRF)
- **REG-S-007 FAIL:** Proxy rejects hostname resolving to loopback (localtest.me). Failed - open finding SEC-001 (image proxy SSRF)
- **REG-S-010 FAIL:** Security response headers present on /. Failed - security headers not configured (existing finding)
- **AUTH-05b FAIL:** Profile check fails with 500: no account shown, sent to login (existing BUG-010 logout path). Failed - by design since BUG-010 (session kept on server errors)
- **AZ-06 BLOCKED:** Cross-user access (IDOR) on orders, addresses, payments. Requires two real customer accounts; none available. Not tested; no requests sent.
- **AZ-07 BLOCKED:** Customer token cannot reach admin routes. Requires a valid customer token; none available. Not tested.
- **ENV-01 BLOCKED:** Production host OS (GHSA-p293-qw3h-jr36 exposure). Hosting details not available to this audit. The advisory is fixed by version either way.
