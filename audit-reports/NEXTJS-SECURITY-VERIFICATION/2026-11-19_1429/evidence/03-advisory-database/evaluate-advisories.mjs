// Evaluates every GitHub-reviewed advisory for next and React (RSC) packages
// against the original and installed versions. Exposure notes come from the
// feature-usage scan (see feature-usage.txt); they are reviewed by hand afterwards.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const semver = require("C:/Program Files/nodejs/node_modules/npm/node_modules/semver");

import { fileURLToPath } from "node:url";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const G = path.join(DIR, "ghsa");
const VERSIONS = {
  next: { before: "16.1.6", after: "16.4.6" },
  react: { before: "19.2.3", after: "19.2.3" },
  "react-dom": { before: "19.2.3", after: "19.2.3" },
  // Next bundles its own React build for the App Router / RSC runtime.
  "react-server-dom-webpack": { before: "BUNDLED_BEFORE", after: "19.3.0-canary-278794d7-20261002" },
  "react-server-dom-turbopack": { before: "BUNDLED_BEFORE", after: "19.3.0-canary-278794d7-20261002" },
  "react-server-dom-parcel": { before: null, after: null }, // Parcel integration not used by Next
};
const bundledBefore = process.argv[2] || null; // React build bundled in next 16.1.6
for (const k of ["react-server-dom-webpack", "react-server-dom-turbopack"]) VERSIONS[k].before = bundledBefore;

const sat = (v, range) => v && semver.satisfies(v, range.replace(/,\s*/g, " "), { includePrerelease: true });

function exposure(a) {
  const t = `${a.summary}\n${a.description || ""}`;
  const rules = [
    [/WebSocket/i, "Not reachable: no custom server or WebSocket upgrade handling"],
    [/custom server/i, "Not reachable: no custom server (next start)"],
    [/Pages Router/i, "Not reachable: App Router only, no pages/ directory"],
    [/\bi18n\b/i, "Not reachable: no i18n configuration"],
    [/middleware|proxy bypass|Proxy request/i, "Not reachable: no middleware.ts / proxy.ts"],
    [/use cache|Cache Components|cacheComponents/i, "Not reachable: 'use cache' / Cache Components not used"],
    [/Server Action/i, "Not reachable (app code): no 'use server' Server Actions defined"],
    [/edge runtime/i, "Not reachable: no edge runtime routes"],
    [/ImageResponse|next\/og/i, "Not reachable: next/og ImageResponse not used"],
    [/metadata image|opengraph/i, "Not reachable: no metadata image routes"],
    [/rewrite/i, "Not reachable: only an internal rewrite (/favicon.ico -> /favicon.png); no external rewrite destinations"],
    [/Image Optimi[sz]|next\/image|image optimi[sz]/i, "Reachable: next/image used (20 files), dangerouslyAllowSVG: true, wildcard https remotePatterns"],
    [/windows/i, "Depends on hosting OS (developer machines are Windows; production host OS not verified)"],
    [/dev server|HMR|next dev|development server/i, "Development only (next dev on developer machines)"],
    [/Server Components|React Server|RSC|App Router/i, "Reachable: App Router with Server Components"],
  ];
  for (const [re, note] of rules) if (re.test(t)) return note;
  return "Review needed: general server behaviour";
}

const out = [];
for (const pkg of Object.keys(VERSIONS)) {
  const lines = fs.readFileSync(path.join(G, `${pkg}.ndjson`), "utf8").trim().split("\n").filter(Boolean);
  for (const l of lines) {
    const a = JSON.parse(l);
    const vulns = a.vulnerabilities.filter((v) => v.package?.name === pkg);
    const ranges = vulns.map((v) => v.vulnerable_version_range);
    const patched = vulns.map((v) => v.first_patched_version).filter(Boolean);
    const { before, after } = VERSIONS[pkg];
    const affBefore = before ? ranges.some((r) => sat(before, r)) : null;
    const affAfter = after ? ranges.some((r) => sat(after, r)) : null;
    out.push({
      package: pkg, ghsa_id: a.ghsa_id, cve_id: a.cve_id, severity: a.severity, summary: a.summary,
      published_at: a.published_at, withdrawn_at: a.withdrawn_at, url: a.html_url,
      vulnerable_ranges: ranges, first_patched: patched,
      version_before: before, version_after: after,
      affected_before: affBefore, affected_after: affAfter,
      exposure_note: exposure(a),
    });
  }
}
fs.writeFileSync(path.join(DIR, "advisory-eval.json"), JSON.stringify(out, null, 2));
const by = (f) => out.filter(f).length;
console.log("total advisories:", out.length, JSON.stringify(Object.fromEntries(Object.keys(VERSIONS).map((p) => [p, by((x) => x.package === p)]))));
console.log("withdrawn:", by((x) => x.withdrawn_at));
console.log("affected installed versions (after):", by((x) => x.affected_after === true));
console.log("affected original versions (before):", by((x) => x.affected_before === true));
console.log("fixed by upgrade (before yes, after no):", by((x) => x.affected_before && x.affected_after === false));
for (const x of out.filter((x) => x.affected_before || x.affected_after)) console.log(`${x.package.padEnd(26)} ${x.ghsa_id} ${String(x.cve_id).padEnd(15)} ${x.severity.padEnd(8)} before:${x.affected_before ? "Y" : "n"} after:${x.affected_after ? "Y" : "n"} | ${x.summary.slice(0, 80)} || ${x.exposure_note.slice(0, 60)}`);
