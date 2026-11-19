// Static map of backend routes (hashtag-backend src/routes/v1) to their auth guard.
// Usage: node backend-route-auth.mjs <backendRepo> <outJson>
import fs from "node:fs";
import path from "node:path";

const [REPO, OUT] = process.argv.slice(2);
const R = path.join(REPO, "src/routes/v1");
const routes = [];
for (const group of ["Common", "User", "Admin"]) {
  const idx = fs.readFileSync(path.join(R, group, "index.js"), "utf8");
  const vars = Object.fromEntries([...idx.matchAll(/const\s+(\w+)\s*=\s*require\(\s*["'`]\.\/([^"'`]+)["'`]\s*\)/g)].map((m) => [m[1], m[2]]));
  for (const m of idx.matchAll(/path:\s*["'`]([^"'`]+)["'`]\s*,\s*route:\s*(\w+)/g)) {
    const prefix = m[1].replace(/\/$/, "");
    const file = vars[m[2]]; if (!file) continue;
    const fp = path.join(R, group, file.endsWith(".js") ? file : `${file}.js`);
    const src = fs.readFileSync(fp, "utf8");
    const globalGuard = /router\.use\(\s*[\w.]*(verifyAuthJWTToken|requireAdmin)/.exec(src)?.[1] || null;
    for (const d of src.matchAll(/router\.(get|post|put|patch|delete)\(\s*(['"`])(.*?)\2\s*,([\s\S]*?)\)\s*;/g)) {
      const args = d[4];
      const guard = /requireAdmin/.test(args) ? "admin" : /verifyAuthJWTToken/.test(args) ? "user-jwt" : globalGuard === "requireAdmin" ? "admin (router.use)" : globalGuard ? "user-jwt (router.use)" : "none";
      const handler = (args.match(/(\w+Controller\.\w+|\w+\.\w+)\s*$/) || [])[1] || args.trim().split(",").pop().trim();
      routes.push({ method: d[1].toUpperCase(), path: `${prefix}${d[3] === "/" ? "" : d[3]}`.replace(/\/+/g, "/"), guard, limiter: /Limiter/.test(args), handler, file: path.relative(REPO, fp).replace(/\\/g, "/") });
    }
  }
}
fs.writeFileSync(OUT, JSON.stringify(routes, null, 2));
const c = routes.reduce((m, r) => ((m[r.guard.split(" ")[0]] = (m[r.guard.split(" ")[0]] || 0) + 1), m), {});
console.log("routes:", routes.length, JSON.stringify(c));
console.log("== unguarded routes (method path -> handler):");
for (const r of routes.filter((r) => r.guard === "none")) console.log(`  ${r.method.padEnd(6)} ${r.path.padEnd(48)} ${r.handler}${r.limiter ? "  [rate-limited]" : ""}`);
