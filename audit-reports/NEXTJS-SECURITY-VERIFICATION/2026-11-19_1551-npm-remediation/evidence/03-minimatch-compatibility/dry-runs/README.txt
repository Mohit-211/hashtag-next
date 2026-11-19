Variant A = minimatch override only (APPROVED and applied).
Variant B = minimatch override + forcing zod ^4.6.6 under @imgly/background-removal (REJECTED: runtime unchanged because IMG.LY bundles zod 3.24.2; breaks IMG.LY type declarations - see ../../02-imgly-zod-analysis/typetest-z4).
Both were run with 'npm install --package-lock-only --ignore-scripts' on copies of package.json/package-lock.json outside the repo; the repo was not modified by these dry runs.
