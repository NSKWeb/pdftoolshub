import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAnalyticsEnabled } from "@/lib/analytics";

const scriptSrc = ["'self'", "'unsafe-eval'", "'unsafe-inline'"];
const connectSrc = ["'self'"];
if (isAnalyticsEnabled()) {
  scriptSrc.push("https://www.googletagmanager.com");
  connectSrc.push("https://www.google-analytics.com", "https://*.google-analytics.com");
}

const securityHeaders: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`
  ].join("; ")
};

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}