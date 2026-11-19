# SEC-004 manual regression checklist

These checks ran on 2026-11-19, with Next 16.4.6 installed in the local project on branch `nextjs-security-upgrade` at `a70e15c`. Playwright drove Chrome and direct HTTP requests were made; the screenshots were reviewed afterwards. No person clicked through the site.

Where a 16.1.6 comparison is given, it comes from the same checks run earlier the same day on a 16.1.6 production build of the same application code (`fa403e3`).

Legend: ✅ pass · ⚠️ pass with a note · ❌ fail · ➖ blocked or not applicable

## A. Production build (`next start`, port 3107)

Raw data: `raw/regression-checks-16.4.6.json`, compared with `raw/regression-checks-16.1.6-baseline.json`.

| # | Check | 16.4.6 result | Same as 16.1.6? | |
|---|---|---|---|---|
| A1 | `/favicon.ico` rewrite | 200 `image/png`, 12,694 B, same bytes as `/favicon.png` | yes, byte-identical | ✅ |
| A2 | `/send-otp` redirect | 307 → `/forgot-password` | yes | ✅ |
| A3 | `/send-otp?x=1` | 307 → `/forgot-password?x=1` (query string kept) | yes | ✅ |
| A4 | `/verify-otp` redirect | 307 → `/login` | yes | ✅ |
| A5 | `/contact` redirect | 307 → `/contact-us` | yes | ✅ |
| A6 | `/contact/` (trailing slash) | 308 → `/contact`, then the redirect above | yes | ✅ |
| A7 | Image optimizer, local JPEG | 200 `image/jpeg`, 44,417 B | yes, byte-identical | ✅ |
| A8 | Image optimizer, local SVG (`dangerouslyAllowSVG`) | 200 `image/svg+xml`, sent with the configured sandbox CSP and `Content-Disposition: attachment` | yes, byte-identical | ✅ |
| A9 | Image optimizer, remote backend image (wildcard `remotePatterns`) | 200 `image/png`, 9,095 B | yes, byte-identical | ✅ |
| A10 | Image optimizer rejects an invalid width | 400 | yes | ✅ |
| A11 | Image proxy `/api/proxy-image` with a backend image | 200 `image/png`, 281,633 B | yes, byte-identical | ✅ |
| A12 | Image optimizer with a `/api/proxy-image?url=…` source | 400 | yes, also 400 on 16.1.6 | ⚠️ |
| A13 | `robots.txt` and `sitemap.xml` | 200 and 200 | yes, byte-identical | ✅ |
| A14 | Unknown route | 404 page | yes | ✅ |
| A15 | Product page `/product/103440` with real data | 5 of 5 images loaded, 0 broken, 0 page errors | yes | ✅ |
| A16 | Home page with real data | 15 of 15 images loaded, 0 broken | yes | ✅ |
| A17 | `/categories` and `/gallery` with real data | 0 broken images, 0 page errors, 0 failed local requests | yes | ✅ |
| A18 | Visual comparison of 8 pages | 7 pixel-identical. On the gallery, 0.64% differs, all in the auto-scrolling ticker band (rows 646–658). | n/a | ✅ |

**About A12:** Next 16 refuses local image URLs that carry a query string unless `images.localPatterns` allows it, and this was already the case on 16.1.6. The app's `ProxyImage` component does not depend on it (A11 and A15 pass). This is not caused by the upgrade.

**Screenshots:** `screenshots/prod-16.4.6-*.png` and `screenshots/prod-16.1.6-*.png`. Pixel results are in `raw/screenshot-comparison.txt`.

## B. Authentication (`audit-reports/raw/sec003.spec.mjs`, unmodified, in-browser API mock)

Raw data: `raw/auth-tests-sec003.json`, `raw/auth-tests-sec003-console.txt`, and the 16.1.6 baseline `raw/auth-tests-sec003-16.1.6-baseline.json`.

| # | Check | Result | |
|---|---|---|---|
| B1 | 14 sign-in and session cases (redirect to login, account access, logout, logout in another tab, invalid and expired tokens, no redirect loops, token never in URLs or console) | 13 of 14 passed; same results as 16.1.6 | ✅ |
| B2 | SEC003-05b "profile check fails with 500 → sent to login" | Failed on both versions | ⚠️ |

**About B2:** this case predates the BUG-010 fix, which deliberately keeps the session when the profile check fails with a server error. It fails by design and is not related to SEC-004.

## C. Development server (`npm run dev`, 16.4.6, port 3000, real production API, normal browser security)

Raw data: `raw/dev-server-checks.json` and `raw/dev-server-log.txt`.

| # | Check | Result | |
|---|---|---|---|
| C1 | Home page `/` | 200, 15 of 15 images, 0 console errors | ✅ |
| C2 | Login `/login` | 200, "Welcome back", 0 console errors | ✅ |
| C3 | Signup `/login?mode=register` | 200, "Create your account", 0 console errors | ✅ |
| C4 | `/send-otp` (OTP page, replaced by email links) | Redirects to `/forgot-password`, which loads ("Forgot your password?") | ✅ |
| C5 | `/verify-otp` (OTP page, replaced by email links) | Redirects to `/login`, which loads | ✅ |
| C6 | `/contact` | Redirects to `/contact-us`, which loads | ✅ |
| C7 | Product listing `/categories/industry/1/tech-and-startups` | 200, 48 product links, "1,318 items", 0 broken images, 0 console errors | ✅ |
| C8 | `/categories` | 200, 0 broken images, 0 console errors | ✅ |
| C9 | Product page `/product/103440` | 200, 5 of 5 images. The URL becomes `?variant_id=2746028`. | ✅ |
| C10 | Gallery `/gallery` | 200, 0 broken images. 5 console errors, all 504s from the image optimizer. | ⚠️ |
| C11 | Header navigation: Gallery → Use Cases → Home | All three client-side navigations reached the right page, with 0 page errors | ✅ |
| C12 | Dev-server log | 98 requests, all 200 or redirects. No compile or runtime errors besides the 5 C10 timeouts. | ✅ |

**About C9:** adding `?variant_id=` to the URL is the app's own code (`ProductDetail.tsx:310`, unchanged since 2026-11-13).

**About C10:** the dev log names the cause: "⨯ upstream image response timed out". Next allows the optimizer 7 seconds to download an upstream image, and the backend's multi-MB gallery originals can exceed that when many are fetched at once on a cold cache. The gallery's fallback still showed every image. Requested again one at a time, all 5 returned 200 in 2.3–3.1 s (`raw/dev-gallery-images-sequential.txt`). The same timeouts occurred on 16.1.6, which reported them as 500 instead of 504. This is not a regression.

**About C12:** the log also contains 55 dev-only `[browser]` warnings from `next/image`. 52 say "has fill but is missing sizes" and 3 are LCP `loading` hints. They point at existing image markup in the app and are performance hints, not errors.

**Screenshots:** `screenshots/dev-*.png`.

## D. Other application flows

These were run during the upgrade itself, on an isolated copy with the identical lock file and application code, against both 16.1.6 and 16.4.6.

| # | Check | 16.1.6 | 16.4.6 | |
|---|---|---|---|---|
| D1 | Change-password and cart-preview accessibility suite | 21 of 21 | 21 of 21 | ✅ |
| D2 | Payment history pagination suite | 14 of 14 | 14 of 14 | ✅ |
| D3 | Customizer with real data: 4 print methods, 4 garment views, artwork upload with background-removal preview | n/a | all steps passed | ✅ |

Raw data: `raw/password-cart-suite-*`, `raw/payment-history-suite-*`, `raw/customizer-check-16.4.6-isolated-copy.json`.

## Result

No regression was found. Every check behaves the same on 16.4.6 as on 16.1.6. The ⚠️ items are pre-existing behaviour, each explained above.
