// SEC-003 verification: /account login guard. Runs against a local `next start`.
// Every request to the API host is answered by an in-browser mock (never production).
// The fake token below is a test value; it is never printed or put in a URL.
import { chromium } from "file:///D:/blockcod/CurrentProject/hashtag-next/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.BASE;
const API_HOST = "node.hashtagbillionaire.com"; // public NEXT_PUBLIC_API_URL host, seen in the browser bundle
const TOKEN_KEY = "hastagBillionaire";
const FAKE_TOKEN = "sec003-fake-token";
const LOGIN_RE = /\/login\?returnTo=%2Faccount$/;
const R = [];
const rec = (id, name, pass, detail) => { R.push({ id, name, status: pass ? "Passed" : "Failed", detail }); console.log(pass ? "PASS" : "FAIL", id, name, pass ? "" : JSON.stringify(detail)); };

const browser = await chromium.launch({ channel: "chrome" });
const PROFILE = { id: 7, email: "audit.user@example.test", user_profile: { name: "Audit Test User", mobile: "5550100" } };

/** profile: "ok" | "invalid" | "expired" | "error500"; delayMs delays the profile answer. */
async function newCtx({ token = null, profile = "ok", delayMs = 0 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const calls = [];
  const cors = { "access-control-allow-origin": BASE, "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS", "content-type": "application/json" };
  await ctx.route("**/*", async (route) => {
    const req = route.request(); const u = new URL(req.url());
    if (u.hostname !== API_HOST) {
      if (u.hostname === "localhost") return route.continue();
      return route.abort(); // third-party (fonts, analytics) not needed
    }
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const path = u.pathname.replace(/^\/api\/v1\//, "");
    calls.push({ method: req.method(), path, hasToken: !!req.headers()["x-access-token"] });
    if (req.method() !== "GET") return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ success: true, data: {} }) });
    if (path === "user/profile") {
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      if (!req.headers()["x-access-token"]) return route.fulfill({ status: 401, headers: cors, body: JSON.stringify({ message: "Please authenticate" }) });
      if (profile === "invalid") return route.fulfill({ status: 401, headers: cors, body: JSON.stringify({ message: "invalid token" }) });
      if (profile === "expired") return route.fulfill({ status: 401, headers: cors, body: JSON.stringify({ message: "jwt expired" }) });
      if (profile === "error500") return route.fulfill({ status: 500, headers: cors, body: JSON.stringify({ message: "Server error" }) });
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ data: PROFILE }) });
    }
    return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ data: { data: [], rows: [], pagination: { page: 1, totalPages: 1, total: 0, limit: 10 } } }) });
  });
  if (token) await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem("__seeded")) { localStorage.setItem(k, v); sessionStorage.setItem("__seeded", "1"); } }, [TOKEN_KEY, token]);
  // Record whether account content EVER appears in the DOM (even for one frame).
  await ctx.addInitScript(() => {
    window.__accountSeen = false;
    new MutationObserver(() => { if (/Profile Information|Change Password|Delete account/.test(document.body?.innerText || "")) window.__accountSeen = true; })
      .observe(document, { childList: true, subtree: true, characterData: true });
  });
  const page = await ctx.newPage();
  const navs = []; page.on("framenavigated", (f) => f === page.mainFrame() && navs.push(f.url()));
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  return { ctx, page, calls, navs, errs };
}
const accountCalls = (calls) => calls.filter((c) => /^(user\/profile|address|graphics|user\/deactivate)/.test(c.path));
const settle = (p, ms = 2500) => p.waitForTimeout(ms);
const token = (p) => p.evaluate((k) => localStorage.getItem(k), TOKEN_KEY);

// 1. Signed-out → login, no account content, no account API calls
{
  const { ctx, page, calls, navs, errs } = await newCtx();
  await page.goto(BASE + "/account"); await settle(page);
  const seen = await page.evaluate(() => window.__accountSeen);
  rec("SEC003-01", "Signed-out user opening /account is redirected to login with returnTo", LOGIN_RE.test(page.url()) && !seen && accountCalls(calls).length === 0 && !errs.length,
    { finalUrl: page.url(), accountContentSeen: seen, accountApiCalls: accountCalls(calls), navigations: navs.length, pageErrors: errs });
  // 8. No loop: stays on login, single redirect
  await settle(page, 3000);
  const loginNavs = navs.filter((u) => u.includes("/login")).length;
  rec("SEC003-08a", "No redirect loop for signed-out user (stable on login)", LOGIN_RE.test(page.url()) && loginNavs === 1, { navigations: navs, loginNavs });
  await ctx.close();
}

// 2. Signed-in → account loads; content hidden while the session check is pending
{
  const { ctx, page, calls, errs } = await newCtx({ token: FAKE_TOKEN, delayMs: 1500 });
  await page.goto(BASE + "/account");
  await page.waitForTimeout(600);
  const pendingText = (await page.locator("main, body").first().innerText()).replace(/\s+/g, " ");
  const pendingOk = /Checking your session/.test(pendingText) && !(await page.evaluate(() => window.__accountSeen));
  rec("SEC003-02a", "While the token is being verified, no account content is rendered", pendingOk, { textDuringCheck: pendingText.slice(0, 160) });
  await page.waitForSelector("text=Profile Information", { timeout: 10000 });
  const nameVal = await page.locator("input").evaluateAll((els) => els.map((e) => e.value));
  rec("SEC003-02", "Signed-in user (valid token) sees the account page", page.url() === BASE + "/account" && nameVal.includes("Audit Test User") && nameVal.includes("audit.user@example.test") && !errs.length,
    { finalUrl: page.url(), profileFieldValues: nameVal.filter(Boolean), profileCall: calls.find((c) => c.path === "user/profile") });
  // Existing functionality: section switching still works
  const sw = {};
  for (const [label, marker] of [["Saved Addresses", /address/i], ["Saved Graphics", /graphic/i], ["Change Password", /password/i], ["Profile Information", /Profile Information/]]) {
    await page.getByRole("button", { name: label }).first().click(); await page.waitForTimeout(400);
    sw[label] = marker.test(await page.locator("section .container > div.flex-1").first().innerText());
  }
  rec("SEC003-02b", "Account sections (profile, addresses, graphics, password) still switch", Object.values(sw).every(Boolean) && page.url() === BASE + "/account", sw);
  // 6. Refresh while signed in
  await page.reload(); await page.waitForSelector("text=Profile Information", { timeout: 10000 }).catch(() => {});
  rec("SEC003-06a", "Refreshing /account while signed in keeps access", page.url() === BASE + "/account" && /Profile Information/.test(await page.locator("body").innerText()), { finalUrl: page.url() });
  // 3. Logout from the account sidebar
  await page.getByRole("button", { name: /log ?out/i }).first().click(); await settle(page, 1500);
  const afterLogoutUrl = page.url(); const tokAfter = await token(page);
  await page.goto(BASE + "/account"); await settle(page);
  rec("SEC003-03", "Logout on the account page removes access (home, token cleared, /account → login)", afterLogoutUrl === BASE + "/" && tokAfter === null && LOGIN_RE.test(page.url()),
    { afterLogoutUrl, tokenCleared: tokAfter === null, revisitUrl: page.url() });
  // 6b. Refresh while signed out
  await page.goto(BASE + "/account"); await page.reload(); await settle(page);
  rec("SEC003-06b", "Refreshing /account while signed out redirects to login", LOGIN_RE.test(page.url()), { finalUrl: page.url() });
  await ctx.close();
}

// 3b. Logout in another tab
{
  const { ctx, page } = await newCtx({ token: FAKE_TOKEN });
  await page.goto(BASE + "/account"); await page.waitForSelector("text=Profile Information", { timeout: 10000 });
  const other = await ctx.newPage(); await other.goto(BASE + "/about");
  await other.evaluate((k) => localStorage.removeItem(k), TOKEN_KEY); await settle(page);
  const stillShown = /Profile Information/.test(await page.locator("body").innerText());
  rec("SEC003-03b", "Logout in another tab removes access on the open account page", LOGIN_RE.test(page.url()) && !stillShown, { finalUrl: page.url() });
  await ctx.close();
}

// 4 / 5. Invalid, expired token, server error
for (const [id, name, profile] of [["SEC003-04", "Invalid token: access denied, token cleared, sent to login", "invalid"], ["SEC003-05", "Expired token (jwt expired): logged out and redirected to login", "expired"], ["SEC003-05b", "Profile check fails with 500: no account shown, sent to login (existing BUG-010 logout path)", "error500"]]) {
  const { ctx, page, navs, errs } = await newCtx({ token: FAKE_TOKEN, profile });
  await page.goto(BASE + "/account"); await settle(page, 3500);
  const seen = await page.evaluate(() => window.__accountSeen); const tok = await token(page);
  const loginNavs = navs.filter((u) => u.includes("/login")).length;
  rec(id, name, LOGIN_RE.test(page.url()) && !seen && tok === null && loginNavs <= 2 && !errs.length,
    { finalUrl: page.url(), accountContentSeen: seen, tokenCleared: tok === null, loginNavigations: loginNavs, urlContainsToken: navs.some((u) => u.includes(FAKE_TOKEN)) });
  await ctx.close();
}

// 8b. Login page itself with returnTo=/account and no token does not bounce
{
  const { ctx, page, navs } = await newCtx();
  await page.goto(BASE + "/login?returnTo=%2Faccount"); await settle(page, 3000); const n3 = navs.length; await settle(page, 4000);
  rec("SEC003-08b", "Login page with returnTo=/account is stable (no loop back to /account)", LOGIN_RE.test(page.url()) && navs.length === n3 && navs.every((u) => LOGIN_RE.test(u)), { navigations: navs, note: "Login page emits 2 same-URL navigation events at load (its own hydration); check is: never leaves login, count stable over 4 s" });
  await ctx.close();
}

// Token never exposed in URLs or console
{
  const { ctx, page, navs } = await newCtx({ token: FAKE_TOKEN, profile: "expired" });
  const logs = []; page.on("console", (m) => logs.push(m.text()));
  await page.goto(BASE + "/account"); await settle(page, 3000);
  rec("SEC003-09", "Token never appears in URLs or console output", !navs.some((u) => u.includes(FAKE_TOKEN)) && !logs.some((l) => l.includes(FAKE_TOKEN)), { navigations: navs, consoleLines: logs.length });
  await ctx.close();
}

await browser.close();
fs.writeFileSync(process.argv[2], JSON.stringify(R, null, 2));
const f = R.filter((r) => r.status !== "Passed").length;
console.log(`${R.length - f} passed, ${f} failed`);
