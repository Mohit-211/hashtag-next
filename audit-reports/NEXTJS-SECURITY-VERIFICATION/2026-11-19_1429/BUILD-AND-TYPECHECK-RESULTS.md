# Build, type-check, lint and regression results

**Project:** hashtag-next · **Branch:** `nextjs-security-upgrade` @ `4c3565a` (implementation commit `a70e15c`) · **Run:** 2026-11-19_1429 · **Generated:** 2026-11-19T09:31:46.068Z

| Check | Command | Result | Status |
|---|---|---|---|
| Production build | `npm run build` | Exit 0; Compiled successfully in 2.5s; 27/27 static pages; 30 routes, same table as SEC-004 | **PASS** |
| TypeScript | `npx tsc --noEmit` | Exit 0, no type errors | **PASS** |
| ESLint | `npx eslint src` | Exit 0; ✖ 1 problem (0 errors, 1 warning) (new rule no-location-assign-relative-destination at src/errors/ApiErrorHandler.js:48) | **PASS** |
| Unit / integration test runner | `inspect package.json scripts` | No unit or integration test runner is configured (scripts: dev, build, start, lint; no jest/vitest). The existing browser suites below were run instead. | **BLOCKED** |
| 69 page-load tests (23 routes x 3 viewports) | `node audit.spec (runnable copy; see spec-provenance.txt)` | 69/69 passed | **PASS** |
| Existing audit suite, all checks | `audit.spec` | 85 passed, 6 failed, 2 blocked (identical to the SEC-004 run) | see below |
| Existing authentication suite | `sec003.spec` | 13 passed, 1 failed (SEC003-05b by design) | see below |

## Production build

`npm run build` exited 0 on Next.js 16.4.6 (Turbopack). All 27 static pages were generated, and the route table (30 routes) is identical to the SEC-004 build. The full output is in [build.txt](evidence/04-build-typecheck-lint/build.txt).

```
▲ Next.js 16.4.6 (Turbopack)
✓ Compiled successfully in 2.5s
✓ Generating static pages using 7 workers (27/27) in 837ms
Route (app)                                 Revalidate  Expire
# exit code: 0
```

## TypeScript

`npx tsc --noEmit`: exit 0, no output, so there are no type errors. See [tsc.txt](evidence/04-build-typecheck-lint/tsc.txt).

## ESLint

`npx eslint src`: exit 0, **0 errors and 1 warning**. See [eslint.txt](evidence/04-build-typecheck-lint/eslint.txt).

```
  48:9  warning  Do not use `window.location.href` to navigate to internal Next.js pages. Use `redirect()` in the render phase, or `useRouter().push()` in Client Components' event handlers instead. See: https://nextjs.org/docs/messages/no-location-assign-relative-destination  @next/next/no-location-assign-relative-destination
✖ 1 problem (0 errors, 1 warning)
```

The rule `@next/next/no-location-assign-relative-destination` is new in eslint-config-next 16.x. It flags the expired-session handler's deliberate full-page navigation to `/login`. It is not a security finding.

## Existing regression suites

The original spec files (`audit-reports/raw/audit.spec.mjs` and `sec003.spec.mjs`) were deleted from the working tree at about 14:25, before this audit. The runs below use preserved copies. Reversing their two or three path and launch edits reproduces the original git blob hashes exactly, as shown in [spec-provenance.txt](evidence/07-regression-suites/spec-provenance.txt).

| Suite | Result | Notes |
|---|---|---|
| Page loads (69) | 69/69 passed | — |
| F-011 Login form rejects malformed email | Failed | existing finding (login email validation) |
| F-012 Forgot-password form rejects empty email | Failed | existing finding (forgot-password validation) |
| F-016 Category listing shows products (catalog search/filter base) | Blocked | blocked: API CORS allows only http://localhost:3000 |
| F-017 Product detail page renders for first listed product | Blocked | blocked: depends on F-016 |
| S-004 Proxy rejects IPv6 loopback [::1] | Failed | open finding SEC-001 (image proxy SSRF) |
| S-006 Proxy rejects IPv4-mapped IPv6 loopback | Failed | open finding SEC-001 (image proxy SSRF) |
| S-007 Proxy rejects hostname resolving to loopback (localtest.me) | Failed | open finding SEC-001 (image proxy SSRF) |
| S-010 Security response headers present on / | Failed | security headers not configured (existing finding) |
| Auth suite (14 cases) | 13/14 passed | SEC003-05b fails by design since BUG-010 |

No unit or integration test runner is configured in `package.json`, so there were no unit tests to run (BLOCKED, see TEST-RESULTS.md BLD-04).
