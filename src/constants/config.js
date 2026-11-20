const config = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL,

  // Every API request fails after 20 s without an answer, so a hung backend
  // can't leave spinners and disabled buttons up for minutes (BUG-013).
  // Requests that upload files set a longer timeout from their size: see
  // uploadTimeout() in src/api/client.ts.
  TIMEOUT: 20000,
};

export default config;
