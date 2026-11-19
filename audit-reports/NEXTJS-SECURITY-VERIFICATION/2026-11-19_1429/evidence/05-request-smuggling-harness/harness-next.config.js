// Controlled test harness for GHSA-ggv3-7p47-pfv8: an EXTERNAL rewrite to a local backend.
module.exports = {
  async rewrites() {
    return [{ source: "/backend/:path*", destination: "http://127.0.0.1:4011/:path*" }];
  },
};
