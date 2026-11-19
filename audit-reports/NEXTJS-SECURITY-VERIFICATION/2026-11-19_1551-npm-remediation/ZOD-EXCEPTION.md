# Documented exception: zod GHSA-mrhx-c7xc-m3w5 under @imgly/background-removal

**Status:** accepted as an exception until upstream ships a fix · **Decided:** 2026-11-19 by the project owner: keep it documented; do not force Zod 4; do not downgrade IMG.LY · **Tracking:** SEC-005 · **Re-check:** at every dependency review and on every new @imgly/background-removal release

## The finding

| Field | Value |
|---|---|
| Advisory | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) / CVE-2023-54404: "Zod can exhaust memory while validating oversized constrained collections" |
| Severity | High, CVSS 3.1 score 7.5 (`AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H`) |
| Affected / patched | zod `< 4.6.6` / `4.6.6` |
| Flaw | Array validation parses every element and keeps every per-element issue, with no cap or early exit. A very large, invalid array sent to an array schema can exhaust memory. |
| Path | `hashtagbillionaire` → `@imgly/background-removal@1.7.0` (a runtime dependency) → `zod@3.25.76` |
| Installed copy | `node_modules/@imgly/background-removal/node_modules/zod` (3.25.76) |
| npm audit entries | `zod` (high) and `@imgly/background-removal` (high). One finding, counted twice. |
| Not affected | Root `zod@4.6.7`, used by the app's own forms (`src/lib/validation.ts`, the login, register and reset forms, and others), is patched. |
| Residual risk in this app | **Negligible.** See [Why the risk is negligible in this app](#why-the-risk-is-negligible-in-this-app). |
| Last verified | 2026-11-19 16:07 +0530. `npm audit` (all and `--omit=dev`) reports only this finding: 2 high entries, 0 others. The installed versions are unchanged: IMG.LY 1.7.0, nested zod 3.25.76, root zod 4.6.7. |
| Main report | [NPM-AUDIT-REMEDIATION-REPORT.md](NPM-AUDIT-REMEDIATION-REPORT.md) |

## Why it cannot be fixed now

1. **There is no patched Zod 3.** The last 3.x release is 3.25.76, from 2025-07-08. The only fix is 4.6.6 (2026-10-11).
2. **There is no newer IMG.LY release.** 1.7.0 is `latest` (`next` is the older 1.6.0-rc.0), and it declares `"zod": "^3.23.8"`.
3. **npm's suggested fix is a downgrade.** It suggests `@imgly/background-removal@1.1.5`, an older release with no zod dependency that also uses a different onnxruntime-web (`^1.16.0` instead of `1.21.0`). That would need a compatibility review and approval. It was not approved, so `npm audit fix --force` must not be run.
4. **Forcing Zod 4 into IMG.LY was tested and rejected.** With an override such as `"@imgly/background-removal": { "zod": "^4.6.6" }`, `npm audit` reports 0, but:
   - **Runtime is unchanged.** IMG.LY's runtime code never loads this zod copy (see below), so the override fixes nothing.
   - **IMG.LY's types break.** `dist/src/schema.d.ts` is written against the Zod 3 types (`ZodEffects`, `ZodObject<…, "strip", …>`, `ZodEnum<[…]>`). With Zod 4 there are 8 type errors in that file when `skipLibCheck` is off. With the project's `skipLibCheck: true`, the config type silently loosens, and an invalid value such as `device: "tpu"` is accepted.
   - **It hides the finding without fixing it.** Evidence: [typetest-z3/tsc-output.txt](evidence/02-imgly-zod-analysis/typetest-z3/tsc-output.txt) and [typetest-z4/tsc-output.txt](evidence/02-imgly-zod-analysis/typetest-z4/tsc-output.txt). The 2 `ndarray` "missing declaration file" errors appear in both and are an existing gap in IMG.LY's own typings, unrelated to Zod.

## Why the risk is negligible in this app

1. **The flagged copy is never loaded at runtime.** IMG.LY 1.7.0's `dist/index.mjs` and `dist/index.cjs` contain their own **bundled copy of zod 3.24.2** (source marker `// ../../node_modules/.pnpm/zod@3.24.2/...`). The only modules they import are `onnxruntime-web` and `onnxruntime-web/webgpu`. The installed `zod@3.25.76` is used only by the type file `dist/src/schema.d.ts`. Evidence: [imgly-runtime-zod-evidence.txt](evidence/02-imgly-zod-analysis/imgly-runtime-zod-evidence.txt).
2. **The bundled copy has the same flaw, but nothing can reach it.** The bundled zod 3.24.2 `ZodArray._parse` behaves the same way: it parses every element and collects every issue. The flaw needs an **array schema** fed **untrusted, oversized input**. IMG.LY has one schema, `ConfigSchema`, for its config object. It contains strings, booleans, enums, a number, `any` and an optional function, and **no array schema**. The only collection-like part is the 3-item argument tuple of the optional `progress` callback. This app does not pass that callback, and when one is passed IMG.LY itself calls it with three values.
3. **The validated input comes from the developer, not from users.** The app's only call is `removeBackground(job.src)` in `src/components/product/customization/Productcustomizationpage.tsx`. No config is passed, so IMG.LY validates `{}`. The image itself never goes through Zod.
4. **It runs in the user's own browser.** Background removal runs client-side on a file the user picked. Even a successful memory exhaustion would only affect that user's own tab, not the server or other users.

**Residual risk:** negligible under current usage. It would matter only if:

- the app starts passing user-controlled data into IMG.LY's config, or
- IMG.LY adds array schemas that validate untrusted input.

## Effect on scanners and CI

- `npm audit` (all and `--omit=dev`) keeps reporting **2 high** and exits with code 1.
- Any CI gate running `npm audit --audit-level=high` will fail on this finding. npm has no built-in allowlist, so such a gate needs an explicit allowance for GHSA-mrhx-c7xc-m3w5 limited to the `@imgly/background-removal` path. Do not use a blanket ignore.

## Follow-up actions

1. Watch for IMG.LY releases (`npm view @imgly/background-removal version dependencies`). When a release depends on or bundles zod ≥ 4.6.6, review it for compatibility, upgrade, and close this exception.
2. Re-review this exception if any change passes user-controlled values into `removeBackground`, `preload` or IMG.LY's other APIs as configuration.
3. Never run `npm audit fix --force` on this project. It would downgrade IMG.LY to 1.1.5 (and shadcn to 1.0.0).
4. If the exception has to be closed before upstream acts, the options are:
   - an approved compatibility review of a different IMG.LY version, or
   - replacing the background-removal library.

   Both are product decisions, not lockfile changes.
