/**
 * Server-side GET for URLs supplied by the client, without SSRF (SEC-001).
 *
 * The image proxy fetches whatever URL a visitor gives it, so it must never be
 * able to reach this server or anything on its internal network. Checking the
 * hostname string is not enough: IPv6 and IPv4-mapped literals, DNS names that
 * point inward (localtest.me -> 127.0.0.1), DNS rebinding and redirects all get
 * past it. This module closes those gaps:
 *
 * 1. Every hostname is resolved once with dns.lookup (all addresses, in the
 *    resolver's own order) and refused if ANY address is not public.
 * 2. The socket connects through a `lookup` hook that only returns those
 *    already-validated addresses. No second DNS query happens, so a rebinding
 *    DNS server cannot swap in a different IP after the check.
 * 3. Redirects are never followed automatically. Each Location is checked with
 *    the same rules, and pinned the same way, before it is requested.
 *
 * It uses node:http/node:https rather than fetch(): Node's built-in fetch has
 * no supported way to choose the address it connects to without adding the
 * undici package as a dependency.
 *
 * Server-only (imports node:dns and node:http).
 */
import { promises as dnsPromises, type LookupAddress } from "node:dns";
import http, { type IncomingMessage } from "node:http";
import https from "node:https";
import net, { type LookupFunction } from "node:net";
import { pipeline, type Readable } from "node:stream";
import zlib from "node:zlib";

/** Thrown when a URL, or a redirect it leads to, must not be fetched. */
export class UnsafeTargetError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "UnsafeTargetError";
  }
}

// Address ranges that are not on the public internet. They are refused whether
// they appear in the URL or come back from DNS.
//
// IPv4 and IPv6 need separate lists: net.BlockList treats an IPv4 address and
// its ::ffff:-mapped IPv6 form as the same address, so putting ::ffff:0:0/96 in
// a shared list would block every IPv4 address.
const NON_PUBLIC_IPV4: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8], // "this network", incl. the unspecified address 0.0.0.0
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT (internal on some clouds)
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation (TEST-NET-1)
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation (TEST-NET-2)
  ["203.0.113.0", 24], // documentation (TEST-NET-3)
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, incl. broadcast 255.255.255.255
];

const NON_PUBLIC_IPV6: ReadonlyArray<readonly [string, number]> = [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["::", 96], // IPv4-compatible (deprecated), embeds an IPv4 address
  ["::ffff:0:0", 96], // IPv4-mapped, e.g. ::ffff:127.0.0.1
  ["64:ff9b::", 96], // NAT64 well-known prefix, embeds an IPv4 address
  ["64:ff9b:1::", 48], // NAT64 local-use prefix
  ["100::", 64], // discard-only
  ["2001::", 32], // Teredo, embeds an IPv4 address
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4, embeds an IPv4 address
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["fec0::", 10], // site-local (deprecated)
  ["ff00::", 8], // multicast
];

function toBlockList(
  ranges: ReadonlyArray<readonly [string, number]>,
  type: "ipv4" | "ipv6",
): net.BlockList {
  const list = new net.BlockList();
  for (const [prefix, bits] of ranges) list.addSubnet(prefix, bits, type);
  return list;
}

const blockedIPv4 = toBlockList(NON_PUBLIC_IPV4, "ipv4");
const blockedIPv6 = toBlockList(NON_PUBLIC_IPV6, "ipv6");

/** True only for a public unicast IPv4 or IPv6 address. */
export function isPublicAddress(address: string): boolean {
  // A zone index ("fe80::1%eth0") only ever appears on local-scope addresses.
  if (address.includes("%")) return false;
  try {
    switch (net.isIP(address)) {
      case 4:
        return !blockedIPv4.check(address, "ipv4");
      case 6:
        return !blockedIPv6.check(address, "ipv6");
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/** Lower-cases a URL hostname and strips IPv6 brackets and a trailing root dot. */
function normalizeHost(hostname: string): string {
  let host = hostname.toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  if (host.endsWith(".")) host = host.slice(0, -1);
  return host;
}

// fetch() refuses these ports (the WHATWG Fetch "bad port" list, as enforced by
// Node's undici). Keep refusing them now that requests go through node:http.
const BAD_PORTS = new Set([
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 69, 77, 79,
  87, 95, 101, 102, 103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 137,
  139, 143, 161, 179, 389, 427, 465, 512, 513, 514, 515, 526, 530, 531, 532,
  540, 548, 554, 556, 563, 587, 601, 636, 989, 990, 993, 995, 1719, 1720, 1723,
  2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668, 6669,
  6679, 6697, 10080,
]);

function assertFetchableUrl(url: URL): void {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeTargetError(`Protocol ${url.protocol} is not allowed`);
  }
  if (url.username || url.password) {
    throw new UnsafeTargetError("URLs with credentials are not allowed");
  }
  if (url.port && BAD_PORTS.has(Number(url.port))) {
    throw new UnsafeTargetError(`Port ${url.port} is not allowed`);
  }
}

/**
 * Resolves `hostname` and returns its addresses. Throws UnsafeTargetError if it
 * cannot be resolved or if ANY address is not public: one private answer is
 * enough to refuse, because the connection could use any of them.
 */
export async function resolvePublicAddresses(hostname: string): Promise<LookupAddress[]> {
  const host = normalizeHost(hostname);
  if (!host) throw new UnsafeTargetError("Empty hostname");
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new UnsafeTargetError(`${host} is a loopback name`);
  }

  const literalFamily = net.isIP(host);
  if (literalFamily) {
    if (!isPublicAddress(host)) throw new UnsafeTargetError(`${host} is not a public address`);
    return [{ address: host, family: literalFamily }];
  }

  let addresses: LookupAddress[];
  try {
    addresses = await dnsPromises.lookup(host, { all: true, verbatim: true });
  } catch (err) {
    throw new UnsafeTargetError(`DNS lookup failed for ${host}`, { cause: err });
  }
  if (addresses.length === 0) throw new UnsafeTargetError(`${host} has no addresses`);
  const rejected = addresses.find((a) => !isPublicAddress(a.address));
  if (rejected) {
    throw new UnsafeTargetError(`${host} resolves to non-public address ${rejected.address}`);
  }
  return addresses;
}

/**
 * A socket `lookup` that never queries DNS. It answers only for `host`, and
 * only with addresses that already passed resolvePublicAddresses(), so the IP
 * the socket connects to is always one that was validated. This is what stops
 * DNS rebinding. (Node skips `lookup` for IP-literal hosts; those are
 * validated directly by resolvePublicAddresses().)
 */
function pinnedLookup(host: string, addresses: readonly LookupAddress[]): LookupFunction {
  return (hostname, options, callback) => {
    const wanted =
      options.family === 4 || options.family === "IPv4" ? 4
      : options.family === 6 || options.family === "IPv6" ? 6
      : 0;
    const matches = addresses.filter((a) => wanted === 0 || a.family === wanted);
    process.nextTick(() => {
      if (normalizeHost(hostname) !== host || matches.length === 0) {
        callback(new UnsafeTargetError(`No validated address for ${hostname}`), "");
      } else if (options.all) {
        callback(null, matches);
      } else {
        callback(null, matches[0].address, matches[0].family);
      }
    });
  };
}

// Keep-alive pools used only by this module. Every socket in them was opened
// through pinnedLookup, so reusing one can never reach an address that was not
// validated. (The shared global agents can hold sockets that other code opened
// with an ordinary DNS lookup.)
const httpAgent = new http.Agent({ keepAlive: true, timeout: 5_000 });
const httpsAgent = new https.Agent({ keepAlive: true, timeout: 5_000 });

function requestPinned(
  url: URL,
  addresses: readonly LookupAddress[],
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<IncomingMessage> {
  const secure = url.protocol === "https:";
  const options: https.RequestOptions = {
    method: "GET",
    headers,
    signal,
    agent: secure ? httpsAgent : httpAgent,
    lookup: pinnedLookup(normalizeHost(url.hostname), addresses),
  };
  return new Promise((resolve, reject) => {
    const req = secure
      ? https.request(url, options, resolve)
      : http.request(url, options, resolve);
    req.on("error", reject);
    req.end();
  });
}

// The statuses fetch() follows automatically.
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export interface PublicFetchOptions {
  /** Aborts the whole exchange: every redirect hop and the body. */
  signal: AbortSignal;
  headers?: Record<string, string>;
  /** Redirect hops to follow. Each target is validated like the first URL. */
  maxRedirects?: number;
  /** When set, every URL (initial and each redirect) must have its normalized
   *  hostname in this set. Prevents the proxy from reaching unapproved hosts. */
  allowedHosts?: ReadonlySet<string>;
  /** When true, only HTTPS URLs are accepted (HTTP is refused). */
  httpsOnly?: boolean;
}

/**
 * GETs `url` from the public internet only, following up to `maxRedirects`
 * redirects, each validated and pinned separately. Resolves with the final
 * non-redirect response, whose body has not been read yet.
 *
 * Throws UnsafeTargetError when the URL or any redirect target is refused.
 * Other errors (timeouts, connection failures, too many redirects) are
 * ordinary Errors.
 */
export async function fetchPublicUrl(
  url: URL,
  { signal, headers = {}, maxRedirects = 5, allowedHosts, httpsOnly }: PublicFetchOptions,
): Promise<IncomingMessage> {
  const seen = new Set<string>();
  let target = url;
  for (let redirects = 0; ; redirects++) {
    assertFetchableUrl(target);
    if (httpsOnly && target.protocol !== "https:") {
      throw new UnsafeTargetError("Only HTTPS URLs are allowed");
    }
    if (allowedHosts) {
      const host = normalizeHost(target.hostname);
      if (!allowedHosts.has(host)) {
        throw new UnsafeTargetError(`Host ${host} is not in the allowlist`);
      }
    }
    const addresses = await resolvePublicAddresses(target.hostname);
    signal.throwIfAborted();
    const res = await requestPinned(target, addresses, headers, signal);

    const location = res.headers.location;
    if (!REDIRECT_STATUSES.has(res.statusCode ?? 0) || !location) return res;
    res.destroy();

    if (redirects >= maxRedirects) throw new Error(`More than ${maxRedirects} redirects`);
    let next: URL;
    try {
      next = new URL(location, target);
    } catch (err) {
      throw new UnsafeTargetError("Redirect location is not a valid URL", { cause: err });
    }
    const key = next.href;
    if (seen.has(key)) throw new Error("Redirect loop detected");
    seen.add(key);
    target = next;
  }
}

const ignoreError = () => {};

/** Largest body readBody() keeps in memory, counted after decompression (SEC-002). */
export const MAX_PROXY_BODY_BYTES = 10 * 1024 * 1024;

/** The upstream body is over MAX_PROXY_BODY_BYTES; nothing more is read. */
export class ResponseTooLargeError extends Error {
  constructor() {
    super(`Response body is too large (over ${MAX_PROXY_BODY_BYTES} bytes)`);
    this.name = "ResponseTooLargeError";
  }
}

/**
 * Reads a response body into memory, undoing any Content-Encoding the way
 * fetch() did transparently. Stops with ResponseTooLargeError once the body,
 * decompressed, would pass MAX_PROXY_BODY_BYTES (or Content-Length says so).
 */
export async function readBody(res: IncomingMessage): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(res.headers["content-length"]);
  if (Number.isFinite(declared) && declared > MAX_PROXY_BODY_BYTES) {
    res.destroy();
    throw new ResponseTooLargeError();
  }
  const encoding = String(res.headers["content-encoding"] ?? "").trim().toLowerCase();
  let source: Readable = res;
  if (encoding === "gzip" || encoding === "x-gzip") {
    source = pipeline(res, zlib.createGunzip(), ignoreError);
  } else if (encoding === "deflate") {
    source = pipeline(res, zlib.createInflate(), ignoreError);
  } else if (encoding === "br") {
    source = pipeline(res, zlib.createBrotliDecompress(), ignoreError);
  } else if (encoding && encoding !== "identity") {
    res.destroy();
    throw new Error(`Unsupported Content-Encoding: ${encoding}`);
  }

  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of source) {
    length += (chunk as Buffer).length;
    if (length > MAX_PROXY_BODY_BYTES) {
      source.destroy();
      res.destroy();
      throw new ResponseTooLargeError();
    }
    chunks.push(chunk as Buffer);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return body;
}
