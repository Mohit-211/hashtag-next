// Local logging backend for the GHSA-ggv3-7p47-pfv8 harness (127.0.0.1 only).
// Logs every request its HTTP parser sees, plus the raw bytes of each connection.
import http from "node:http";
import fs from "node:fs";

const PORT = Number(process.argv[2] || 4011);
const LOG = process.argv[3];
let connSeq = 0;
const log = (o) => fs.appendFileSync(LOG, JSON.stringify({ t: new Date().toISOString(), ...o }) + "\n");
const esc = (b) => b.toString("latin1").replace(/\r/g, "\\r").replace(/\n/g, "\\n");

const server = http.createServer({ keepAlive: true }, (req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    log({ event: "request", conn: req.socket.__id, method: req.method, url: req.url, contentLength: req.headers["content-length"] ?? null, transferEncoding: req.headers["transfer-encoding"] ?? null, bodyBytes: body.length, body: esc(body).slice(0, 300) });
    res.writeHead(200, { "content-type": "text/plain" });
    res.end(`backend-ok ${req.method} ${req.url}\n`);
  });
});
server.on("connection", (socket) => {
  socket.__id = ++connSeq;
  socket.on("data", (d) => log({ event: "raw", conn: socket.__id, bytes: d.length, data: esc(d).slice(0, 600) }));
});
server.on("clientError", (err, socket) => { log({ event: "clientError", conn: socket.__id, code: err.code, message: err.message }); socket.destroy(); });
server.listen(PORT, "127.0.0.1", () => console.log(`backend listening on 127.0.0.1:${PORT}`));
