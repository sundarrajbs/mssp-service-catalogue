import type { NextConfig } from "next";

import { frameAncestorsFromEnv } from "./src/lib/security/csp";

/**
 * Static security headers for every response. The CSP is set per request in src/proxy.ts.
 * X-Frame-Options can't name an allowed origin, so it's only sent when no trusted
 * embedders are configured; otherwise CSP frame-ancestors (in the proxy) governs framing.
 */
const allowsTrustedEmbedders = frameAncestorsFromEnv(process.env.FRAME_ANCESTORS).length > 0;

const securityHeaders = [
  ...(allowsTrustedEmbedders ? [] : [{ key: "X-Frame-Options", value: "DENY" }]),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "browsing-topics=()",
      "camera=()",
      "display-capture=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    // Builder pages moved under /app when sign-in was added.
    return ["library", "tiers", "slas", "pricing", "coverage", "export", "settings"].map((page) => ({
      source: `/${page}`,
      destination: `/app/${page}`,
      permanent: true,
    }));
  },
  experimental: {
    // Room for a catalogue with a logo (up to 1 MB) when saving through a server action.
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
