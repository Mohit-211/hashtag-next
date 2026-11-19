# SEC-004 final summary

**Verified on:** 2026-11-19, local project, branch `nextjs-security-upgrade`, commit `a70e15c` (not merged)

**Verdict:** the security checks and the required regression tests passed. SEC-004 is fixed on this branch and needs the PR merged to reach `main`. That does not make the project vulnerability-free: 30 packages unrelated to Next still have advisories (section 3).

## 1. Versions installed in the local project (`npm ls`)

| Package | Before | Now |
|---|---|---|
| `next` | 16.1.6 | **16.4.6** |
| `eslint-config-next` | 16.1.6 | **16.4.6** |
| `@next/swc-win32-x64-msvc` (native compiler) | 16.1.6 | 16.4.6 |
| `sharp` (used by Next's image optimizer) | 0.34.5 | 0.35.5 |
| `postcss` bundled in `next` | 8.4.31 | 8.5.23 |

Lock-file changes are limited to Next's own dependency tree: 44 entries, listed in `dependency-versions.txt`.

## 2. Security audit

| | Original audit (2026-11-18) | Before upgrade (2026-11-19) | After upgrade |
|---|---|---|---|
| Critical | 3 | 2 | **1** |
| High | 27 | 16 | **14** |
| Moderate | 12 | 14 | 14 |
| Low | 0 | 1 | 1 |
| **Total packages** | 42 | 33 | **30** |
| `next` advisories | 38 | 38 | **0** |
| `postcss` (in next) advisories | 4 | 4 | **0** |
| `sharp` advisories | 3 | 3 | **0** |

- **All 45 advisories resolved.** Every one recorded in the original evidence against `next`, `postcss` and `sharp` is gone, each checked individually in `npm-audit-after.txt`.
- **All four critical RCEs resolved.** These are RCE on Windows-hosted servers, RCE in the image optimizer through AVIF, RCE through SVG (this app sets `dangerouslyAllowSVG`), and RCE in `use cache` with typed arrays.
- **Both advisories named in the finding resolved.** "HTTP request smuggling in rewrites" (GHSA-ggv3-7p47-pfv8) and "unbounded next/image disk cache growth" (GHSA-3x4c-7xq6-9pq8). npm rates both moderate; the finding's "critical" rating comes from the RCE advisories above.

## 3. Remaining vulnerabilities (not part of SEC-004)

There are 30 packages in total. In production dependencies alone (`npm audit --omit=dev`) there are 7: 6 high, 1 low, 0 critical.

| Package | Severity | Where it comes from | Owner |
|---|---|---|---|
| `axios`, `follow-redirects` | high | axios, a direct dependency | SEC-005 |
| `zod` | high | direct dependency and `@imgly/background-removal` | SEC-005 |
| `@imgly/background-removal` | high | direct dependency, through its `zod` | SEC-005 |
| `dompurify` | low | direct dependency | SEC-005 |
| `nanoid` 3.3.17 | high | used by `postcss` (both Tailwind's and Next's). The advisory is about custom generators with size 0, which postcss does not use. A lock-only bump to 3.3.18 fixes it. | dependency clean-up |
| `source-map-js` 1.2.1 | high | used by `postcss` (both Tailwind's and Next's). It is a denial-of-service when parsing a crafted source map at build time. A lock-only bump to 1.2.2 fixes it. | dependency clean-up |
| `proxy-addr` and the other 22 | 1 critical, rest high or below | dev-only tooling: the `shadcn` CLI (through `@modelcontextprotocol/sdk` and `express`), typescript-eslint and similar | dependency clean-up |

`npm audit` does not attribute `nanoid` or `source-map-js` to `next`, and both were present before the upgrade.

## 4. Code, build and tests

| Check | Result | Evidence |
|---|---|---|
| `npx tsc --noEmit` | ✅ exit 0, no errors | `typescript-test.txt` |
| `npx eslint src` | ✅ exit 0, 0 errors, **1 warning** | `eslint-test.txt` |
| `npm run build` | ✅ exit 0, compiled in 9.7 s, 27 of 27 static pages, no warnings. Route table identical to 16.1.6 (30 routes). | `production-build.txt` |
| Page-load tests, `audit.spec.mjs` unmodified | ✅ **69 of 69 passed** | `page-load-tests.txt` |
| Whole audit suite | 85 passed, 6 failed, 2 blocked. **Identical to 16.1.6**, test by test. | `page-load-tests.txt` |
| Auth suite, `sec003.spec.mjs` unmodified | 13 of 14, identical to 16.1.6 (05b fails by design since BUG-010) | `manual-regression-checklist.md` B |
| Rewrite, redirects, image optimizer, remote images, image proxy | ✅ same behaviour as 16.1.6; responses byte-identical | `manual-regression-checklist.md` A |
| Dev server with real data | ✅ all pages load, redirects work, navigation works | `manual-regression-checklist.md` C |
| Visual comparison | ✅ 7 of 8 pages pixel-identical; the 8th differs only in the moving ticker band | `raw/screenshot-comparison.txt` |

**The ESLint warning:** `@next/next/no-location-assign-relative-destination` at `src/errors/ApiErrorHandler.js:48`. This rule is new in eslint-config-next 16.x, and 16.1.6 reported nothing. The line is the expired-session handler's deliberate full-page navigation to `/login`. It was neither suppressed nor changed.

**Failures and blocked tests in the audit suite:** all of these existed before the upgrade and are separate findings. They were left as they are.

| Test | Status | Cause |
|---|---|---|
| F-011 | Failed | Login form validation |
| F-012 | Failed | Forgot-password form validation |
| F-016 | Blocked | The API refuses browser calls from `localhost:3107`, so no catalog data loads |
| F-017 | Blocked | Depends on F-016 |
| S-004, S-006, S-007 | Failed | Image-proxy SSRF filter, open finding SEC-001 |
| S-010 | Failed | Security response headers not configured |

## 5. Side effects of the upgrade that need a decision

1. **`AGENTS.md` is now generated by `next dev`.** Next 16.4's dev server writes a 679-byte `AGENTS.md` (guidance for AI coding agents) into the project root and re-creates it on every run. It is currently untracked and was **not** staged. Options:
   - commit it
   - set `agentRules: false` in `next.config.ts`
   - add it to `.gitignore`
2. **`npm install` removes `playwright`.** The audit specs import it, but it is not in `package.json`, so any `npm install` deletes it as extraneous. It was restored for these tests with `npm install --no-save playwright@1.65.0`, and the package files were verified unchanged. Adding it as a devDependency would keep the audit specs runnable.
3. **The dev server was stopped.** The `npm run dev` that was running at the start was stopped as instructed, to free Next's native files. It has not been restarted.
4. **Optimizer timeouts now return 504 instead of 500.** When an upstream image is too slow, the status is more accurate now. Behaviour is otherwise unchanged.

## 6. Recommendation

- **Status:** mark SEC-004 **Fixed, pending merge** of `nextjs-security-upgrade`.
- **Follow-ups:**
  - SEC-005 (axios, zod, DOMPurify)
  - a lock-only update for `nanoid` and `source-map-js`
  - a decision on `AGENTS.md`
