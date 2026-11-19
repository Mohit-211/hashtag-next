// Request-handling security tests against the REAL project's production server
// (next start, 127.0.0.1:3107). Raw sockets, local only. Paths are chosen so the
// server does not call the production API: static pages, the internal rewrite,
// the image-proxy route without a url (rejected before any fetch), a 404 path.
import net from "node:net";
import fs from "node:fs";

const PORT = Number(process.argv[2] || 3107);
const OUT = process.argv[3];
const HOST = "127.0.0.1";
const esc = (s) => s.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
function raw(payload, waitMs = 4000) {
  return new Promise((resolve) => {
    const s = net.connect(PORT, HOST); let data = ""; let done = false;
    const finish = (why) => { if (done) return; done = true; s.destroy(); resolve({ data, closedBy: why }); };
    s.on("data", (d) => (data += d.toString("latin1")));
    s.on("end", () => finish("server-closed"));
    s.on("error", (e) => finish("error:" + e.code));
    s.on("connect", () => s.write(payload));
    setTimeout(() => finish("client-timeout"), waitMs);
  });
}
const chunked = (b) => `${Buffer.byteLength(b).toString(16)}\r\n${b}\r\n0\r\n\r\n`;
const probe = (p) => `GET ${p} HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\n\r\n`;
const H = `Host: ${HOST}:${PORT}`;

const tests = [
  // Method handling
  ["M1", "DELETE on a static page (/login)", `DELETE /login HTTP/1.1\r\n${H}\r\nConnection: close\r\n\r\n`, "method"],
  ["M2", "OPTIONS on a static page (/login)", `OPTIONS /login HTTP/1.1\r\n${H}\r\nConnection: close\r\n\r\n`, "method"],
  ["M3", "DELETE on the GET-only route handler (/api/proxy-image)", `DELETE /api/proxy-image HTTP/1.1\r\n${H}\r\nConnection: close\r\n\r\n`, "method"],
  ["M4", "OPTIONS on the GET-only route handler (/api/proxy-image)", `OPTIONS /api/proxy-image HTTP/1.1\r\n${H}\r\nConnection: close\r\n\r\n`, "method"],
  ["M5", "DELETE on the internal rewrite (/favicon.ico -> /favicon.png)", `DELETE /favicon.ico HTTP/1.1\r\n${H}\r\nConnection: close\r\n\r\n`, "method"],
  ["M6", "OPTIONS on the internal rewrite (/favicon.ico)", `OPTIONS /favicon.ico HTTP/1.1\r\n${H}\r\nConnection: close\r\n\r\n`, "method"],
  ["M7", "GET on the internal rewrite (control)", `GET /favicon.ico HTTP/1.1\r\n${H}\r\nConnection: close\r\n\r\n`, "method"],
  // Advisory-style payloads aimed at the real app (no external rewrite exists)
  ["R1", "DELETE /favicon.ico, Transfer-Encoding: chunked, body = a second request", `DELETE /favicon.ico HTTP/1.1\r\n${H}\r\nTransfer-Encoding: chunked\r\n\r\n` + chunked(probe("/smuggle-probe-R1")), "smuggle"],
  ["R2", "OPTIONS /favicon.ico, Transfer-Encoding: chunked, body = a second request", `OPTIONS /favicon.ico HTTP/1.1\r\n${H}\r\nTransfer-Encoding: chunked\r\n\r\n` + chunked(probe("/smuggle-probe-R2")), "smuggle"],
  ["R3", "DELETE /api/proxy-image, Transfer-Encoding: chunked, body = a second request", `DELETE /api/proxy-image HTTP/1.1\r\n${H}\r\nTransfer-Encoding: chunked\r\n\r\n` + chunked(probe("/smuggle-probe-R3")), "smuggle"],
  ["R4", "OPTIONS /login, Transfer-Encoding: chunked, body = a second request", `OPTIONS /login HTTP/1.1\r\n${H}\r\nTransfer-Encoding: chunked\r\n\r\n` + chunked(probe("/smuggle-probe-R4")), "smuggle"],
  // Header conflicts / malformed framing
  ["H1", "Content-Length and Transfer-Encoding: chunked together (CL.TE)", `POST /login HTTP/1.1\r\n${H}\r\nContent-Length: 6\r\nTransfer-Encoding: chunked\r\n\r\n` + chunked(probe("/smuggle-probe-H1")), "header"],
  ["H2", "Transfer-Encoding: chunked then Content-Length (TE.CL order)", `DELETE /favicon.ico HTTP/1.1\r\n${H}\r\nTransfer-Encoding: chunked\r\nContent-Length: 3\r\n\r\n` + chunked(probe("/smuggle-probe-H2")), "header"],
  ["H3", "Two different Content-Length headers", `POST /login HTTP/1.1\r\n${H}\r\nContent-Length: 0\r\nContent-Length: 40\r\n\r\n` + probe("/smuggle-probe-H3"), "header"],
  ["H4", "Obfuscated 'Transfer-Encoding : chunked' (space before colon)", `DELETE /favicon.ico HTTP/1.1\r\n${H}\r\nTransfer-Encoding : chunked\r\n\r\n` + chunked(probe("/smuggle-probe-H4")), "header"],
  ["H5", "Transfer-Encoding: xchunked (unknown coding)", `DELETE /favicon.ico HTTP/1.1\r\n${H}\r\nTransfer-Encoding: xchunked\r\n\r\n` + chunked(probe("/smuggle-probe-H5")), "header"],
  ["H6", "Transfer-Encoding: chunked, chunked (repeated coding)", `DELETE /favicon.ico HTTP/1.1\r\n${H}\r\nTransfer-Encoding: chunked, chunked\r\n\r\n` + chunked(probe("/smuggle-probe-H6")), "header"],
  ["H7", "Header folding (obs-fold) on Transfer-Encoding", `DELETE /favicon.ico HTTP/1.1\r\n${H}\r\nTransfer-Encoding:\r\n chunked\r\n\r\n` + chunked(probe("/smuggle-probe-H7")), "header"],
  ["H8", "Invalid chunk size", `DELETE /favicon.ico HTTP/1.1\r\n${H}\r\nTransfer-Encoding: chunked\r\n\r\nzz\r\nabc\r\n0\r\n\r\n`, "header"],
  ["H9", "Bare LF line endings in the request head", `DELETE /favicon.ico HTTP/1.1\n${H}\nTransfer-Encoding: chunked\n\n` + chunked(probe("/smuggle-probe-H9")), "header"],
  ["H10", "Negative Content-Length", `POST /login HTTP/1.1\r\n${H}\r\nContent-Length: -1\r\n\r\n`, "header"],
  ["H11", "Content-Length with a plus sign (+5)", `POST /login HTTP/1.1\r\n${H}\r\nContent-Length: +5\r\n\r\nhello`, "header"],
  // Pipelining control: two honest requests on one connection must give exactly two responses
  ["P1", "Two pipelined GET requests (control)", probe("/favicon.ico") + `GET /login HTTP/1.1\r\n${H}\r\nConnection: close\r\n\r\n`, "pipeline"],
];

const results = [];
for (const [id, desc, payload, group] of tests) {
  const r = await raw(payload);
  // Unanchored: a second response can directly follow a body that does not end in a newline.
  const statuses = r.data.match(/HTTP\/1\.[01] \d{3} [A-Za-z][^\r\n]*/g) || [];
  const smuggleProbeAnswered = /smuggle-probe/i.test(r.data) || /HTTP\/1\.[01] 404/.test(r.data);
  const allow = (r.data.match(/^allow: [^\r\n]*/gim) || [])[0] || null;
  // A smuggled probe would produce an extra response (404 for /smuggle-probe-*).
  const extraResponse = group === "pipeline" ? statuses.length !== 2 : statuses.length > 1;
  results.push({ id, group, description: desc, request: esc(payload).slice(0, 400), responses: statuses, allowHeader: allow, connection: r.closedBy, extraResponseObserved: extraResponse, smuggleProbeAnswered, responseBytes: r.data.length });
  console.log(`${id.padEnd(4)} ${JSON.stringify(statuses).padEnd(70)} ${allow || ""} ${r.closedBy} bytes=${r.data.length} ${extraResponse ? "EXTRA-RESPONSE!" : ""} ${smuggleProbeAnswered ? "PROBE-ANSWERED!" : ""}`);
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
