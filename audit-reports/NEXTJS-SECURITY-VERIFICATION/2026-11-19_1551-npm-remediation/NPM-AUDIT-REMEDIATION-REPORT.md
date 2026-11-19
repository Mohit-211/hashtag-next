# npm audit remediation (after the Next.js 16.4.6 upgrade)

**Project:** hashtag-next · **Branch:** `nextjs-security-upgrade` @ `4c3565a`, with uncommitted `package.json` and `package-lock.json` changes · **Run:** 2026-11-19_1551-npm-remediation · **Tools:** Node v26.13.0, npm 11.20.0

Nothing in this run was committed, pushed, merged or deployed.

## Overall status

| Area | Status |
|---|---|
| minimatch GHSA-g3hv-75wg-m249 (moderate), shadcn → ts-morph → @ts-morph/common | ✅ **FIXED** with one scoped npm override |
| zod GHSA-mrhx-c7xc-m3w5 (high), @imgly/background-removal → zod 3 | ⚠️ **DOCUMENTED EXCEPTION.** No patched Zod 3 exists, and the flagged copy is used for types only. See [ZOD-EXCEPTION.md](ZOD-EXCEPTION.md). |
| `npm ls --all` | ✅ exit 0. **0 invalid, 0 extraneous, 0 required dependencies missing.** It lists 81 `UNMET OPTIONAL DEPENDENCY` entries, all expected (see [npm ls details](#npm-ls-details)). |
| TypeScript (`tsc --noEmit`) | ✅ exit 0, the same as the baseline |
| ESLint | ✅ 0 errors, 1 warning, the same as the baseline (the deliberate redirect at `src/errors/ApiErrorHandler.js:48`) |
| Production build (`next build`) | ✅ passes, 27/27 static pages, route table identical to the baseline |
| shadcn CLI / ts-morph with the new minimatch | ✅ loads; same output as with minimatch 10.2.6 |
| Next.js | unchanged at 16.4.6 |
| shadcn | unchanged at 4.23.0 |
| @imgly/background-removal | unchanged at 1.7.0 |
| Application source code | unchanged |

## Vulnerability counts

| Stage | Total | Critical | High | Moderate | Low | Production deps only |
|---|---|---|---|---|---|---|
| 1. Original: run 2026-11-19_1429, next 16.4.6, before `npm audit fix` | 30 | 1 | 14 | 14 | 1 | 7 (6 high, 1 low) |
| 2. After `npm audit fix` without `--force` (lockfile only) | 6 | 0 | 2 | 4 | 0 | 2 (2 high) |
| 3. After the minimatch override (this run) | **2** | 0 | **2** | **0** | 0 | 2 (2 high) |

The 2 that remain are **one advisory on one installed copy**: `node_modules/@imgly/background-removal/node_modules/zod@3.25.76`. npm counts it twice, once for `zod` and once for its parent `@imgly/background-removal`.

Of the 30 packages in the original report:

- **24** were fixed by the earlier `npm audit fix` (lockfile updates).
- **4** were fixed by this override, fully or in part:
  - `minimatch`: 1 of 2 copies.
  - `@ts-morph/common`.
  - `ts-morph`.
  - `shadcn`: its ts-morph path. Its zod path was fixed by `npm audit fix`.
- **2** remain:
  - `zod`: 2 of 3 copies were fixed by `npm audit fix`; the IMG.LY copy remains.
  - `@imgly/background-removal`.

The per-package details are in [evidence/06-comparison/vulnerability-comparison.json](evidence/06-comparison/vulnerability-comparison.json).

## Affected dependency paths

| Advisory | Path | Before this run | After |
|---|---|---|---|
| GHSA-g3hv-75wg-m249 (minimatch, moderate; fixed in 11.0.1) | `shadcn@4.23.0` → `ts-morph@26.0.0` → `@ts-morph/common@0.27.0` → `minimatch` | 10.2.6, vulnerable | **11.0.9**, patched |
| (same advisory) | `eslint-config-next` → `typescript-eslint@8.73.0` → `@typescript-eslint/typescript-estree` → `minimatch` | 11.0.9 (patched by the earlier `npm audit fix`) | 11.0.9, unchanged |
| (not affected) | `eslint`, `eslint-plugin-*` → `minimatch` | 3.1.5, outside every minimatch advisory range | 3.1.5, unchanged |
| GHSA-mrhx-c7xc-m3w5 (zod, high; fixed in 4.6.6) | `@imgly/background-removal@1.7.0` → `zod` | 3.25.76 | 3.25.76, **documented exception** |
| (not affected) | root `zod`, used by the app's forms; also shared by shadcn and eslint-plugin-react-hooks | 4.6.7, patched | 4.6.7, unchanged |

## What changed

### Files modified

1. **`package.json`**: one `overrides` block added (+5 lines). Nothing else changed.

   ```json
   "overrides": {
     "@ts-morph/common": {
       "minimatch": "^11.0.1"
     }
   }
   ```

   The range starts at 11.0.1, the first patched release, and the lock resolves it to **11.0.9**. That is the same tarball already installed for typescript-eslint (integrity `sha512-KCFkfyj…F60Q==`). The override only applies to the `minimatch` that `@ts-morph/common` depends on.

2. **`package-lock.json`**, compared with its state after `npm audit fix`:
   - **1 entry changed:** `node_modules/@ts-morph/common/node_modules/minimatch` 10.2.6 → 11.0.9. Its `resolved`, `integrity`, `dependencies` and `engines` changed with it.
   - **6 entries added:** `@tailwindcss/oxide-wasm32-wasi/node_modules/{@emnapi/core, @emnapi/runtime, @emnapi/wasi-threads, @napi-rs/wasm-runtime, @tybys/wasm-util, tslib}`. These records describe the `bundleDependencies` of an optional, dev-only `cpu: wasm32` package. They ship inside that package's tarball, so nothing extra is downloaded. The package is not installed on Windows x64. npm 11.20 writes these records whenever it rewrites the lock.
   - No top-level lock fields changed, and the CRLF line endings were kept.

   Compared with the committed HEAD (`4c3565a`), the lock also contains the earlier, uncommitted `npm audit fix` changes: 41 entries changed, 18 added and 74 removed in total. See [evidence/04-after/lockfile-entry-diff-vs-HEAD-4c3565a.txt](evidence/04-after/lockfile-entry-diff-vs-HEAD-4c3565a.txt).

3. **`node_modules`**: one folder changed (`@ts-morph/common/node_modules/minimatch`).

### Not changed

next, shadcn, ts-morph, @imgly/background-removal, zod, ESLint, typescript-eslint, TypeScript, and all application source code. `npm audit fix --force` was not run.

## Why the minimatch override is safe

- **How @ts-morph/common uses it.** It calls minimatch in exactly two places, both `minimatch(path, pattern)` with default options, inside `getPathMatchesPattern` ([call sites](evidence/03-minimatch-compatibility/ts-morph-common-minimatch-call-sites.txt)).
- **API compatibility.** minimatch 11 still exports `minimatch()`. Compared with 10.2.6 it only drops the `AST` and `makeRe` exports, and ts-morph uses neither. On 8 sample patterns, including negation, brace sets, dot-folders and Windows drive paths, 10.2.6 and 11.0.9 gave the same answers ([comparison](evidence/03-minimatch-compatibility/minimatch-v10-vs-v11-api.txt)).
- **Upstream did the same.** `@ts-morph/common@0.29.1` itself moved to `minimatch ^11.0.1`.
- **No new packages.** Both of minimatch 11.0.9's dependencies were already installed at satisfying versions: `brace-expansion@5.0.13` alongside it, and `@isaacs/nonrecursive-glob-match@1.1.0` at the root. GitHub's advisory database lists 0 advisories for minimatch 11.0.9 and for both of these dependencies.
- **Node version.** minimatch 11.0.9 requires Node `20 || >=22`. This machine runs v26.13.0.
- **How shadcn uses ts-morph.** shadcn only calls `new Project(...)` and `createSourceFile`, which never reach the glob code ([usage](evidence/03-minimatch-compatibility/shadcn-ts-morph-api-usage.txt)). A smoke test ran a shadcn-style AST edit plus glob matching on ts-morph 26. Its results with minimatch 10.2.6 and 11.0.9 were identical, both in scratch installs and in the project's real `node_modules` ([smoke-comparison.txt](evidence/03-minimatch-compatibility/smoke-comparison.txt)). `shadcn --version` prints 4.23.0, and its import chain resolves to minimatch 11.0.9 ([resolution chain](evidence/03-minimatch-compatibility/shadcn-resolution-chain.txt)).
- **Exposure, even before the fix.** The advisory needs an attacker-supplied glob pattern and `optimizationLevel >= 2`. ts-morph uses the default level (1), and shadcn is a developer-only CLI that is not part of the production bundle.

### Alternatives rejected

- **Downgrade shadcn to 1.0.0** (what `npm audit fix --force` would do). Not allowed.
- **Override ts-morph to 28.x or @ts-morph/common to 0.29.1.** Both are bigger jumps and change the TypeScript version bundled in ts-morph, which shadcn 4.23.0 was not built against.

## Validation results

The validation commands were run against the repo's updated `node_modules`; the production build ran in an isolated copy (see the table).

| Check | Result | Evidence |
|---|---|---|
| `npm audit` | 2 high, 0 moderate (exit 1, because of the Zod exception) | [npm-audit.json](evidence/04-after/npm-audit.json), [npm-audit.txt](evidence/04-after/npm-audit.txt) |
| `npm audit --omit=dev` | 2 high (the same Zod exception) | [npm-audit-omit-dev.json](evidence/04-after/npm-audit-omit-dev.json) |
| `npm ls --all`, `npm ls minimatch --all`, `npm ls zod --all` | all exit 0, nothing on stderr. 0 invalid, 0 extraneous, 0 required dependencies missing. 81 unmet **optional** dependencies, all expected (see below). | [npm-ls-all.txt](evidence/04-after/npm-ls-all.txt), [npm-ls-unmet-optional-summary.txt](evidence/04-after/npm-ls-unmet-optional-summary.txt), [npm-ls-minimatch.txt](evidence/04-after/npm-ls-minimatch.txt), [npm-ls-zod.txt](evidence/04-after/npm-ls-zod.txt) |
| `npx tsc --noEmit` | exit 0, no errors (baseline: exit 0) | [tsc.txt](evidence/05-build-typecheck-lint/tsc.txt), [final-state-tsc-eslint.txt](evidence/05-build-typecheck-lint/final-state-tsc-eslint.txt) |
| `npm run lint` | exit 0, 0 errors, 1 warning, identical to the baseline | [eslint.txt](evidence/05-build-typecheck-lint/eslint.txt) |
| `next build` | exit 0: compiled, TypeScript passed, 27/27 static pages, route table identical to run 2026-11-19_1429 | [build.txt](evidence/05-build-typecheck-lint/build.txt), [route-table-diff-vs-baseline.txt](evidence/05-build-typecheck-lint/route-table-diff-vs-baseline.txt) (empty means identical) |

The build ran in an isolated copy: `git archive HEAD`, plus the working `package.json`, `package-lock.json` and `.env`, plus a copy of the updated `node_modules`. This kept the developer's running `next dev` (port 3000) and the shared `.next` folder untouched. The application source in the repo matches HEAD, so the copy builds the same code.

### npm ls details

`npm ls --all` exits 0 with nothing on stderr. Its output has **no invalid, no extraneous and no missing required dependencies**. It does list **81 `UNMET OPTIONAL DEPENDENCY` entries**. These are optional by design, none is needed by the app, and none comes from the minimatch override:

- **73 binaries for other platforms**, declared by sharp (24), unrs-resolver (21), @tailwindcss/oxide (11), lightningcss (10) and next (7). npm installs only the binary for this machine (win32-x64) and skips the others.
- **8 optional peer dependencies** for features the app does not use. The app has no Sass files, no React Compiler setting and no imports of these packages:
  - from next: `sass`, `babel-plugin-react-compiler`, `@playwright/test`, `@opentelemetry/api`
  - `@emotion/is-prop-valid` (framer-motion)
  - `eslint-plugin-import-x` (eslint-import-resolver-typescript)
  - `@typescript/native` (@typescript-eslint/typescript-estree)
  - `babel-plugin-macros` (dedent)

None of these declaring packages changed in this run; the lockfile diff changes only `@ts-morph/common/node_modules/minimatch`. A re-check at 16:07 gave the same 81 entries. The full list, with the package that declares each, is in [evidence/04-after/npm-ls-unmet-optional-summary.txt](evidence/04-after/npm-ls-unmet-optional-summary.txt).

## Notes from the run

1. **npm's hidden lockfile went stale.** The safety step `npm install --package-lock-only` also rewrote `node_modules/.package-lock.json` to minimatch 11.0.9 without changing the installed folder. The next `npm install` trusted that file and reported "up to date" while 10.2.6 was still on disk. This was resolved without any extra dependency change:
   - The stale hidden lockfile was moved aside.
   - `npm install --dry-run` was run, and it showed exactly one change: `change minimatch 10.2.6 => 11.0.9`.
   - `npm install` was then run.

   `package-lock.json` was byte-identical before and after (sha256 `2b87e4c3…6257cd`). Logs: [npm-install.txt](evidence/04-after/npm-install.txt), [npm-install-dry-run-after-hidden-lock-reset.txt](evidence/04-after/npm-install-dry-run-after-hidden-lock-reset.txt), [npm-install-sync.txt](evidence/04-after/npm-install-sync.txt).

   Anyone applying this change from the lockfile should run a plain `npm install` (or `npm ci`), not `--package-lock-only` first.
2. **The first ESLint run failed because of an evidence file.** It flagged a helper script saved in this evidence folder (`require()` imports), not project code. Helper scripts and test files in this folder are therefore saved with a `.txt` extension. The re-run, and a final re-run after all evidence was written, are clean. Log: [eslint-first-run-flagged-evidence-script.txt](evidence/05-build-typecheck-lint/eslint-first-run-flagged-evidence-script.txt).
3. **npm 11.20 install-scripts warning.** npm warns that `protobufjs` and `unrs-resolver` have install scripts not covered by `allowScripts`. Both packages were already installed and were not reinstalled. The warning is unrelated to this change.
4. **The earlier audit file is UTF-16.** `../npm-audit-after-fix.json` was saved by a PowerShell redirect. It was left unchanged, and a UTF-8 copy is in [evidence/00-before/npm-audit-after-fix.utf8-copy.json](evidence/00-before/npm-audit-after-fix.utf8-copy.json).

## Rollback

Restore the two saved files, then run `npm install`:

```sh
cp audit-reports/NEXTJS-SECURITY-VERIFICATION/2026-11-19_1551-npm-remediation/evidence/00-before/package.json.before package.json
cp audit-reports/NEXTJS-SECURITY-VERIFICATION/2026-11-19_1551-npm-remediation/evidence/00-before/package-lock.json.before package-lock.json
npm install
```

The sha256 hashes of the files before and after this change are in [sha256-before.txt](evidence/00-before/sha256-before.txt) and [sha256-after.txt](evidence/04-after/sha256-after.txt).

## Remaining risks and follow-ups

| Item | Risk | Follow-up |
|---|---|---|
| zod GHSA-mrhx-c7xc-m3w5 under @imgly/background-removal | Negligible for current usage (see [ZOD-EXCEPTION.md](ZOD-EXCEPTION.md)). `npm audit` keeps reporting 2 high and exits 1. | SEC-005: upgrade when IMG.LY releases a version on Zod ≥ 4.6.6. Re-review if user input ever reaches IMG.LY's config. Never run `npm audit fix --force`, because it would downgrade IMG.LY to 1.1.5. |
| The minimatch override has to be maintained | Low. It could hide a future incompatible change in @ts-morph/common. | Remove the override once shadcn depends on a ts-morph whose `@ts-morph/common` requires `minimatch ^11` (0.29.1 or later). Check with `npm view shadcn@latest dependencies.ts-morph`. |
| Uncommitted changes | `package.json`, `package-lock.json` and this report folder are not committed. | Commit them together when approved. They hold both the earlier `npm audit fix` result and this override. |

## Evidence index

| Folder | Contents |
|---|---|
| [evidence/00-before/](evidence/00-before/) | State before this change: `npm audit` (all and production-only, json and txt), `npm ls`, backups of `package.json` and `package-lock.json`, sha256 hashes |
| [evidence/01-advisories/](evidence/01-advisories/) | Both GitHub advisories (JSON), advisory lookups per installed and target version, npm registry lookups (zod, IMG.LY, shadcn, ts-morph, minimatch versions and dependencies) |
| [evidence/02-imgly-zod-analysis/](evidence/02-imgly-zod-analysis/) | Proof that IMG.LY bundles zod 3.24.2 and imports only `onnxruntime-web` at runtime; its `schema.d.ts`; type tests with Zod 3 vs Zod 4 |
| [evidence/03-minimatch-compatibility/](evidence/03-minimatch-compatibility/) | ts-morph call sites, v10 vs v11 API comparison, smoke test (scratch installs and the project), shadcn checks, lockfile dry runs for both options |
| [evidence/04-after/](evidence/04-after/) | State after this change: `npm audit`, `npm ls` (with the unmet-optional summary), install logs, lockfile diffs (vs the backup and vs HEAD), `package.json` diff, sha256 hashes |
| [evidence/05-build-typecheck-lint/](evidence/05-build-typecheck-lint/) | `tsc`, ESLint, `next build` logs; route-table diff against the baseline |
| [evidence/06-comparison/](evidence/06-comparison/) | `vulnerability-comparison.json`: all 30 original packages with their final status, and counts for the three stages |
