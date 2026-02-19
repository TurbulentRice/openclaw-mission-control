export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Mission Control",
  openclawBaseUrl: process.env.OPENCLAW_BASE_URL ?? "http://127.0.0.1:18789",
  openclawToken: process.env.OPENCLAW_TOKEN,
};

export function assertServerToken() {
  if (!env.openclawToken) {
    throw new Error("OPENCLAW_TOKEN is missing. Set it in .env.local");
  }
}
