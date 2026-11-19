# Request smuggling verification (GHSA-ggv3-7p47-pfv8 / CVE-2026-29057)

**Project:** hashtag-next · **Branch:** `nextjs-security-upgrade` @ `4c3565a` (implementation commit `a70e15c`) · **Run:** 2026-11-19_1429 · **Generated:** 2026-11-19T09:31:46.068Z

## Verdict

- **Advisory status: FIXED and VERIFIED.** The installed next 16.4.6 is outside the affected range (< 16.1.7). In a controlled harness, 16.4.6 forwards chunked DELETE/OPTIONS bodies with correct framing, while 16.1.6 put a hidden second request on the backend connection.
- **Exposure of this app: NOT APPLICABLE by configuration.** The advisory needs a rewrite to an external backend. This app's only rewrite is `/favicon.ico → /favicon.png`, which is internal, and it has no middleware or proxy file. That was also true on 16.1.6.
- **Real app request handling: PASS.** The production build rejects every Content-Length/Transfer-Encoding conflict and malformed framing case tested (11 of 11 → 400). It never processed a smuggled request.

## 1. What the advisory says

Next.js vendored `http-proxy` for external rewrites. For DELETE and OPTIONS requests it added `content-length: 0` and removed `transfer-encoding`, then still streamed the request body. A chunked DELETE/OPTIONS body could therefore reach the backend as a second, unauthorized request. The fix (16.1.7) adds `content-length: 0` only when both headers are absent, and keeps `transfer-encoding`. Next 16.3 replaced `http-proxy` with `httpxy`, confirmed in [fix-code-presence.txt](evidence/01-inventory/fix-code-presence.txt).

## 2. Configuration analysis of this project

| Item | Finding |
|---|---|
| `rewrites()` in next.config.ts | One rule: `/favicon.ico` → `/favicon.png`. Same-origin path, no external destination. |
| `redirects()` | `/send-otp`, `/verify-otp`, `/contact` → internal paths (redirects are not proxied) |
| Middleware / `proxy.ts` | None |
| Route handlers | `GET /api/proxy-image` only. It creates a new outbound GET with a fixed User-Agent and never forwards the client's method, headers or body. |
| `src/app/api/proxy/[...path]` | Empty, untracked directory with no handler; not in the build |
| Hosting | Self-hosted `next start` (rewrites are handled by Next, not a CDN) |

## 3. Controlled harness: 16.1.6 vs 16.4.6

The harness is a minimal Next app with an **external** rewrite (`/backend/:path*` → `http://127.0.0.1:4011/:path*`) and a logging backend that records every request it parses and the raw bytes it receives. Both are bound to 127.0.0.1, and nothing was sent to production or third parties. Files are in [05-request-smuggling-harness](evidence/05-request-smuggling-harness/).

The body of each attack request is a complete second request, `GET /internal-admin-<id> HTTP/1.1`. The question is whether that request ever reaches the backend as its own HTTP message.

| Test | Request | 16.1.6: client / what the backend parsed | 16.4.6: client / what the backend parsed |
|---|---|---|---|
| S1 | DELETE, Transfer-Encoding: chunked, body = a complete second request (advisory scenario) | HTTP/1.1 500 Internal Server Error / DELETE /S1 cl=0 te=– body=0 | HTTP/1.1 200 OK / DELETE /S1 cl=– te=chunked body=60 |
| S2 | OPTIONS, Transfer-Encoding: chunked, body = a complete second request (advisory scenario) | HTTP/1.1 500 Internal Server Error / OPTIONS /S2 cl=0 te=– body=0 | HTTP/1.1 200 OK / OPTIONS /S2 cl=– te=chunked body=60 |
| S3 | POST, Transfer-Encoding: chunked, same body (control: POST is not in the vulnerable code path) | HTTP/1.1 200 OK / POST /S3 cl=– te=chunked body=60 | HTTP/1.1 200 OK / POST /S3 cl=– te=chunked body=60 |
| S4 | DELETE with Content-Length body containing the same text (control: length-framed body) | HTTP/1.1 200 OK / DELETE /S4 cl=60 te=– body=60 | HTTP/1.1 200 OK / DELETE /S4 cl=60 te=– body=60 |
| S5 | DELETE without a body (baseline) | HTTP/1.1 200 OK / DELETE /S5 cl=0 te=– body=0 | HTTP/1.1 200 OK / DELETE /S5 cl=0 te=– body=0 |
| S6 | DELETE with BOTH Content-Length and Transfer-Encoding: chunked (CL.TE conflict) | HTTP/1.1 400 Bad Request / nothing (rejected) | HTTP/1.1 400 Bad Request / nothing (rejected) |
| S7 | DELETE with two different Content-Length headers | HTTP/1.1 400 Bad Request / nothing (rejected) | HTTP/1.1 400 Bad Request / nothing (rejected) |
| S8 | OPTIONS with obfuscated header 'Transfer-Encoding : chunked' (space before colon) | HTTP/1.1 400 Bad Request / nothing (rejected) | HTTP/1.1 400 Bad Request / nothing (rejected) |
| S9 | DELETE, Transfer-Encoding: chunked, keep-alive, then a normal GET on the same client connection | HTTP/1.1 500 Internal Server Error, HTTP/1.1 200 OK / GET /S9-follow cl=– te=– body=0; DELETE /S9 cl=0 te=– body=0 | HTTP/1.1 200 OK / GET /S9-follow cl=– te=– body=0; DELETE /S9 cl=– te=chunked body=60 |

### The decisive bytes (S1, chunked DELETE)

**next 16.1.6.** This is what the backend socket received. Next stripped `transfer-encoding`, set `content-length: 0`, and wrote the attacker's body right after it, so the hidden request arrives as a **separate HTTP message**:

```http
DELETE /S1-v16.1.6 HTTP/1.1
content-length: 0
connection: close
host: 127.0.0.1:4011
x-forwarded-host: 127.0.0.1:4101

GET /internal-admin-S1-v16.1.6 HTTP/1.1
Host: 127.0.0.1
```

This test backend (Node's HTTP server) stopped reading because the proxy also sent `connection: close`. Next then logged "socket hang up" and returned 500. A backend or intermediary that keeps parsing the connection would execute `GET /internal-admin-…`. That is the request-boundary disagreement the advisory describes.

**next 16.4.6.** The same attack is forwarded with `transfer-encoding: chunked` intact. The hidden request stays inside the chunk (`3c` = 60 bytes) as body data of the single DELETE:

```http
DELETE /S1-v16.4.6 HTTP/1.1
host: 127.0.0.1:4011
transfer-encoding: chunked
connection: close
x-forwarded-host: 127.0.0.1:4102

3c
GET /internal-admin-S1-v16.4.6 HTTP/1.1
Host: 127.0.0.1


0
```

Conflicting or malformed framing (S6 CL+TE, S7 duplicate Content-Length, S8 obfuscated Transfer-Encoding) is rejected with 400 by **both** versions before the proxy runs.

## 4. The real project (production build, next start, 127.0.0.1:3107)

| ID | Request | Response | Status |
|---|---|---|---|
| M1 | DELETE on a static page (/login) | HTTP/1.1 405 Method Not Allowed / Allow: GET. | **PASS** |
| M2 | OPTIONS on a static page (/login) | HTTP/1.1 405 Method Not Allowed / Allow: GET. | **PASS** |
| M3 | DELETE on the GET-only route handler (/api/proxy-image) | HTTP/1.1 405 Method Not Allowed. | **PASS** |
| M4 | OPTIONS on the GET-only route handler (/api/proxy-image) | HTTP/1.1 204 No Content / allow: GET, HEAD, OPTIONS. | **PASS** |
| M5 | DELETE on the internal rewrite (/favicon.ico -> /favicon.png) | HTTP/1.1 500 Internal Server Error / Allow: GET. Expected 405; Next.js answers 500 for non-GET methods on public/ static files (same in 16.1.6; robustness issue, no data exposure). | **FAIL** |
| M6 | OPTIONS on the internal rewrite (/favicon.ico) | HTTP/1.1 500 Internal Server Error / Allow: GET. Expected 405; Next.js answers 500 for non-GET methods on public/ static files (same in 16.1.6; robustness issue, no data exposure). | **FAIL** |
| M7 | GET on the internal rewrite (control) | HTTP/1.1 200 OK. | **PASS** |
| R1 | DELETE /favicon.ico, Transfer-Encoding: chunked, body = a second request | HTTP/1.1 500 Internal Server Error / Allow: GET. Smuggled probe not processed as a second request. | **PASS** |
| R2 | OPTIONS /favicon.ico, Transfer-Encoding: chunked, body = a second request | HTTP/1.1 500 Internal Server Error / Allow: GET. Smuggled probe not processed as a second request. | **PASS** |
| R3 | DELETE /api/proxy-image, Transfer-Encoding: chunked, body = a second request | HTTP/1.1 405 Method Not Allowed. Smuggled probe not processed as a second request. | **PASS** |
| R4 | OPTIONS /login, Transfer-Encoding: chunked, body = a second request | HTTP/1.1 405 Method Not Allowed / Allow: GET. Smuggled probe not processed as a second request. | **PASS** |
| H1 | Content-Length and Transfer-Encoding: chunked together (CL.TE) | HTTP/1.1 400 Bad Request. | **PASS** |
| H2 | Transfer-Encoding: chunked then Content-Length (TE.CL order) | HTTP/1.1 400 Bad Request. | **PASS** |
| H3 | Two different Content-Length headers | HTTP/1.1 400 Bad Request. | **PASS** |
| H4 | Obfuscated 'Transfer-Encoding : chunked' (space before colon) | HTTP/1.1 400 Bad Request. | **PASS** |
| H5 | Transfer-Encoding: xchunked (unknown coding) | HTTP/1.1 400 Bad Request. | **PASS** |
| H6 | Transfer-Encoding: chunked, chunked (repeated coding) | HTTP/1.1 400 Bad Request. | **PASS** |
| H7 | Header folding (obs-fold) on Transfer-Encoding | HTTP/1.1 400 Bad Request. | **PASS** |
| H8 | Invalid chunk size | HTTP/1.1 400 Bad Request. | **PASS** |
| H9 | Bare LF line endings in the request head | HTTP/1.1 400 Bad Request. | **PASS** |
| H10 | Negative Content-Length | HTTP/1.1 400 Bad Request. | **PASS** |
| H11 | Content-Length with a plus sign (+5) | HTTP/1.1 400 Bad Request. | **PASS** |
| P1 | Two pipelined GET requests (control) | HTTP/1.1 200 OK, HTTP/1.1 200 OK. | **PASS** |

**DELETE / OPTIONS:**
- Pages and the GET-only route handler answer 405 with `Allow: GET`.
- Next answers OPTIONS on the route handler itself with 204 and `allow: GET, HEAD, OPTIONS`.
- Non-GET methods on files in `public/` (including `/favicon.ico` through the rewrite) return **500** instead of 405. The same happens in 16.1.6 ([static-file-methods.txt](evidence/05-request-smuggling-harness/static-file-methods.txt)), so it is a pre-existing Next.js robustness issue. It is not a smuggling vector: the chunked-body tests R1/R2 show the body is consumed and no second request is processed.

**Transfer-Encoding and Content-Length:** every conflict and malformed case (H1–H11) is rejected with 400 and the connection is closed. Node's strict HTTP parser enforces this, and Next does not loosen it (no `--insecure-http-parser`).

## 5. Remaining concerns

- **External rewrites in future:** if an external rewrite is added later, 16.4.6 handles this case correctly. The advisory's guidance still applies: enforce authentication on backend routes rather than relying on the rewrite path. The backend already does this for user data (TEST-RESULTS AZ-01 to AZ-03).
- **500 instead of 405:** non-GET requests to static files return 500. This is low risk, but noisy in logs and monitoring.
- **Front proxy or CDN not tested:** if production sits behind a reverse proxy or CDN, that layer's own HTTP parsing is outside this audit.
