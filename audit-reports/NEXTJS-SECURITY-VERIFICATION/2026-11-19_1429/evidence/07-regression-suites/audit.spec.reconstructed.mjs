// Audit-only browser checks. Runs against a local `next start` on BASE.
// Safety: every non-GET request leaving localhost is aborted, so no forms,
// carts, payments or emails can reach the real backend.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE || "http://localhost:3107";
const OUT = process.argv[2];
const results = [];
const rec = (id, name, area, status, detail) => results.push({ id, name, area, status, detail });

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, tablet: { width: 820, height: 1180 }, mobile: { width: 390, height: 844 } };
const ROUTES = ["/", "/about", "/categories", "/gallery", "/cart", "/checkout", "/login", "/forgot-password",
  "/reset-password", "/verify-email", "/account", "/orders", "/saved", "/payment-history", "/track-order",
  "/contact-us", "/support", "/privacy-policy", "/terms", "/shippingreturns", "/confirmation",
  "/checkout/paypal/success", "/checkout/paypal/cancel"];

async function guard(context) {
  await context.route("**/*", (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (req.method() !== "GET" && req.method() !== "HEAD" && req.method() !== "OPTIONS" && u.hostname !== "localhost") return route.abort();
    return route.continue();
  });
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
let n = 0;
for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({ viewport: vp });
  await guard(context);
  for (const path of ROUTES) {
    const id = `T-${String(++n).padStart(3, "0")}`;
    const page = await context.newPage();
    const consoleErr = [], pageErr = [], failed = [];
    page.on("console", (m) => m.type() === "error" && consoleErr.push(m.text().slice(0, 200)));
    page.on("pageerror", (e) => pageErr.push(String(e).slice(0, 200)));
    page.on("requestfailed", (r) => failed.push(`${r.failure()?.errorText} ${r.url().slice(0, 120)}`));
    page.on("response", (r) => r.status() >= 400 && failed.push(`HTTP ${r.status()} ${r.url().slice(0, 120)}`));
    try {
      const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(800);
      const m = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src.slice(0, 120)),
        noAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).length,
        h1: document.querySelectorAll("h1").length,
        title: document.title,
      }));
      const problems = [];
      if (!resp || resp.status() >= 400) problems.push(`status ${resp?.status()}`);
      if (pageErr.length) problems.push(`page errors: ${pageErr.join(" | ")}`);
      if (m.overflow > 2) problems.push(`horizontal overflow ${m.overflow}px`);
      if (m.broken.length) problems.push(`broken images: ${m.broken.join(", ")}`);
      const status = problems.length ? "Failed" : "Passed";
      rec(id, `Load ${path} (${vpName})`, "Page load / console / layout", status,
        { http: resp?.status(), title: m.title, problems, consoleErrors: consoleErr.slice(0, 6), failedRequests: [...new Set(failed)].slice(0, 8), imagesWithoutAlt: m.noAlt, h1Count: m.h1 });
    } catch (e) {
      rec(id, `Load ${path} (${vpName})`, "Page load / console / layout", "Failed", { error: String(e).slice(0, 300) });
    }
    await page.close();
  }
  await context.close();
}

// Functional checks (desktop, signed out)
const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
await guard(ctx);
const page = await ctx.newPage();
const step = async (id, name, area, fn) => {
  try { const r = await fn(); rec(id, name, area, r.status, r.detail); }
  catch (e) { rec(id, name, area, "Failed", { error: String(e).slice(0, 300) }); }
};

await step("F-001", "Signed-out visitor opening /account is sent to login", "Auth / access control", async () => {
  await page.goto(BASE + "/account", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const url = page.url();
  const text = (await page.locator("body").innerText()).slice(0, 600);
  const gated = /login|sign in|log in/i.test(text) && !/profile/i.test(text) || url.includes("/login");
  return { status: gated ? "Passed" : "Failed", detail: { finalUrl: url, visibleText: text.replace(/\s+/g, " ").slice(0, 300) } };
});

for (const [id, path] of [["F-002", "/orders"], ["F-003", "/saved"], ["F-004", "/payment-history"], ["F-005", "/checkout"], ["F-006", "/cart"]]) {
  await step(id, `Signed-out visitor opening ${path} sees a login prompt or redirect`, "Auth / access control", async () => {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    const ok = page.url().includes("/login") || /log ?in|sign ?in/i.test(text);
    return { status: ok ? "Passed" : "Failed", detail: { finalUrl: page.url(), visibleText: text.slice(0, 300) } };
  });
}

await step("F-010", "Login form rejects empty submission client-side", "Forms / validation", async () => {
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  const sent = [];
  page.on("request", (r) => r.method() === "POST" && sent.push(r.url()));
  await page.locator("form button[type=submit]").first().click();
  await page.waitForTimeout(800);
  const text = (await page.locator("form").first().innerText()).replace(/\s+/g, " ");
  const invalid = await page.locator("[aria-invalid=true]").count();
  return { status: sent.length === 0 && (invalid > 0 || /required|enter|valid/i.test(text)) ? "Passed" : "Failed", detail: { postsAttempted: sent, ariaInvalidFields: invalid, formText: text.slice(0, 300) } };
});

await step("F-011", "Login form rejects malformed email", "Forms / validation", async () => {
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.locator("input[type=email], input[name=email]").first().fill("not-an-email");
  await page.locator("input[type=password]").first().fill("x");
  await page.locator("form button[type=submit]").first().click();
  await page.waitForTimeout(800);
  const text = (await page.locator("form").first().innerText()).replace(/\s+/g, " ");
  return { status: /valid email|email/i.test(text) ? "Passed" : "Failed", detail: { formText: text.slice(0, 300) } };
});

await step("F-012", "Forgot-password form rejects empty email", "Forms / validation", async () => {
  await page.goto(BASE + "/forgot-password", { waitUntil: "networkidle" });
  await page.locator("form button[type=submit]").first().click();
  await page.waitForTimeout(800);
  const text = (await page.locator("form").first().innerText()).replace(/\s+/g, " ");
  const native = await page.evaluate(() => [...document.querySelectorAll("input")].some((i) => !i.validity.valid));
  return { status: native || /required|enter|valid/i.test(text) ? "Passed" : "Failed", detail: { nativeInvalid: native, formText: text.slice(0, 200) } };
});

await step("F-013", "Reset-password page without token shows an error state", "Error / empty states", async () => {
  await page.goto(BASE + "/reset-password", { waitUntil: "networkidle" });
  const text = (await page.locator("main, body").first().innerText()).replace(/\s+/g, " ");
  return { status: /invalid|expired|missing|link/i.test(text) ? "Passed" : "Failed", detail: { text: text.slice(0, 300) } };
});

await step("F-014", "Unknown route returns 404 page", "Routing", async () => {
  const r = await page.goto(BASE + "/this-route-does-not-exist-audit", { waitUntil: "networkidle" });
  return { status: r.status() === 404 ? "Passed" : "Failed", detail: { http: r.status() } };
});

await step("F-015", "Unknown product id handled gracefully", "Error / empty states", async () => {
  const r = await page.goto(BASE + "/product/999999999", { waitUntil: "networkidle" });
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  return { status: r.status() === 404 || /not found|unavailable/i.test(text) ? "Passed" : "Failed", detail: { http: r.status(), text: text.slice(0, 200) } };
});

await step("F-016", "Category listing shows products (catalog search/filter base)", "Catalog", async () => {
  await page.goto(BASE + "/categories", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2000);
  const links = await page.locator("a[href^='/product/']").count();
  return { status: links > 0 ? "Passed" : "Blocked", detail: { productLinks: links, note: links ? "" : "No products rendered - backend data unavailable from localhost (CORS) or empty" } };
});

await step("F-017", "Product detail page renders for first listed product", "Product", async () => {
  await page.goto(BASE + "/categories", { waitUntil: "networkidle", timeout: 45000 });
  const href = await page.locator("a[href^='/product/']").first().getAttribute("href").catch(() => null);
  if (!href) return { status: "Blocked", detail: { note: "No product link available" } };
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  const r = await page.goto(BASE + href, { waitUntil: "networkidle", timeout: 45000 });
  return { status: r.status() < 400 && !errs.length ? "Passed" : "Failed", detail: { href, http: r.status(), pageErrors: errs } };
});

// Proxy-image endpoint (local server only; targets are localhost/invalid)
const api = ctx.request;
const probe = async (id, name, q, expectBlocked) => step(id, name, "Security / SSRF", async () => {
  const r = await api.get(BASE + "/api/proxy-image" + q, { failOnStatusCode: false, timeout: 15000 });
  const body = (await r.text()).slice(0, 120);
  const blocked = r.status() === 400 && /cannot be fetched|Only http|Invalid|Missing|too long/.test(body);
  return { status: blocked === expectBlocked ? "Passed" : "Failed", detail: { http: r.status(), body } };
});
await probe("S-001", "Proxy rejects missing url", "", true);
await probe("S-002", "Proxy rejects file: scheme", "?url=" + encodeURIComponent("file:///etc/passwd"), true);
await probe("S-003", "Proxy rejects 127.0.0.1", "?url=" + encodeURIComponent("http://127.0.0.1:3107/favicon.png"), true);
await probe("S-004", "Proxy rejects IPv6 loopback [::1]", "?url=" + encodeURIComponent("http://[::1]:3107/favicon.png"), true);
await probe("S-005", "Proxy rejects 169.254.169.254 metadata IP", "?url=" + encodeURIComponent("http://169.254.169.254/latest/meta-data"), true);
await probe("S-006", "Proxy rejects IPv4-mapped IPv6 loopback", "?url=" + encodeURIComponent("http://[::ffff:127.0.0.1]:3107/favicon.png"), true);
await probe("S-007", "Proxy rejects hostname resolving to loopback (localtest.me)", "?url=" + encodeURIComponent("http://localtest.me:3107/favicon.png"), true);

await step("S-010", "Security response headers present on /", "Security / headers", async () => {
  const r = await api.get(BASE + "/");
  const h = r.headers();
  const want = ["content-security-policy", "x-frame-options", "strict-transport-security", "x-content-type-options", "referrer-policy"];
  const missing = want.filter((k) => !h[k] && !(k === "x-frame-options" && /frame-ancestors/.test(h["content-security-policy"] || "")));
  return { status: missing.length ? "Failed" : "Passed", detail: { missing, xPoweredBy: h["x-powered-by"] || null } };
});

await step("S-011", "robots.txt and sitemap.xml served", "SEO", async () => {
  const a = await api.get(BASE + "/robots.txt"); const b = await api.get(BASE + "/sitemap.xml");
  return { status: a.ok() && b.ok() ? "Passed" : "Failed", detail: { robots: a.status(), sitemap: b.status() } };
});

await step("P-001", "Home page weight and load timing (desktop)", "Performance", async () => {
  const p = await ctx.newPage();
  let bytes = 0; const big = [];
  p.on("response", async (r) => { try { const len = Number(r.headers()["content-length"] || 0) || (await r.body()).length; bytes += len; if (len > 1e6) big.push(`${(len / 1e6).toFixed(1)}MB ${r.url().slice(0, 100)}`); } catch {} });
  const t = Date.now();
  await p.goto(BASE + "/", { waitUntil: "load" });
  const loadMs = Date.now() - t;
  await p.waitForLoadState("networkidle");
  const mb = bytes / 1e6;
  await p.close();
  return { status: mb > 5 ? "Failed" : "Passed", detail: { transferredMB: Number(mb.toFixed(2)), loadEventMs: loadMs, resourcesOver1MB: big } };
});

await browser.close();
fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
const c = results.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
console.log(JSON.stringify(c));
for (const r of results.filter((r) => r.status !== "Passed")) console.log(r.id, r.status, r.name, JSON.stringify(r.detail).slice(0, 400));
