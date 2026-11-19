# Security summary

**Project:** hashtag-next · **Branch:** `nextjs-security-upgrade` @ `4c3565a` (implementation commit `a70e15c`) · **Run:** 2026-11-19_1429 · **Generated:** 2026-11-19T09:31:46.068Z

## Overall status

| Area | Status |
|---|---|
| Next.js / React advisories (109 checked) | ✅ **0 affect the installed versions** |
| HTTP request smuggling in rewrites (GHSA-ggv3-7p47-pfv8) | ✅ **FIXED, VERIFIED** (not reachable in this app) |
| Build, TypeScript, ESLint | ✅ pass (1 lint warning) |
| 69 page-load tests | ✅ 69/69 |
| Backend auth on protected routes | ✅ pass (2 tests BLOCKED) |
| Whole-project dependency audit | ❌ 30 packages still vulnerable (7 in production deps) |
| Other open findings | ❌ image-proxy SSRF (SEC-001), missing security headers |

## Numbers

- **Advisories checked:** 109 (79 next, 30 React).
- **Applied to the original next 16.1.6:** 38 (4 critical, 14 high, 16 medium, 4 low).
- **Fixed:** 38. Of those, 2 VERIFIED, 1 PARTIALLY VERIFIED, and 35 version-verified.
- **Not fixed (Next/React):** 0.
- **Remaining npm audit (all dependencies):** 1 critical, 14 high, 14 moderate, 1 low.
- **Remaining npm audit (production only):** 0 critical, 6 high, 0 moderate, 1 low.
- **Tests:** 105 run, with 85 PASS, 14 FAIL, 6 BLOCKED. FAILs: 3 deliberate 16.1.6 reproductions, 2 npm audit totals, 2 pre-existing static-file 500s, 4 open security findings (SEC-001 ×3, headers), 2 existing form-validation findings and 1 by-design auth case. None is caused by the upgrade. See TEST-RESULTS.md.

## Final recommendation

1. **Next.js upgrade:** the upgrade to 16.4.6 is verified for the Next.js advisories and the PR can be merged on that basis. Nothing in this audit blocks it.
2. **SEC-005:** fix next, because axios, follow-redirects, zod and DOMPurify are the high-severity production advisories. Bump `nanoid` and `source-map-js` in the lock file.
3. **SEC-001:** fix the image-proxy SSRF. Resolve DNS and block private addresses, IPv6 and IPv4-mapped forms, and re-check redirect targets or disable redirect-following.
4. **Headers and hardening:** add security headers, turn off `poweredByHeader`, and consider an explicit `images.maximumDiskCacheSize` and a narrower `images.remotePatterns`.
5. **Blocked tests:** run the IDOR and admin-escalation tests with two test accounts.
