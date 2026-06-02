import { NextResponse, type NextRequest } from "next/server";

const staleChunkPaths = new Set([
  // Compatibility shim for HCDN-cached HTML that references previous build chunk names.
  "/_next/static/chunks/0lso1.baz3dt2.css",
  "/_next/static/chunks/0r5tu.q7qbgz1.css",
  "/_next/static/chunks/0hfxl6prnj62v.css",
  "/_next/static/chunks/0h~lqnkna01or.js",
  "/_next/static/chunks/04p6trxw0v781.js",
  "/_next/static/chunks/turbopack-0zud-c~c9_rn~.js",
  "/_next/static/chunks/17wxew6jq_rxj.js",
  "/_next/static/chunks/0e~5fhe0i9.37.js",
  "/_next/static/chunks/03ns3bn3xpe7f.js",
  "/_next/static/chunks/0alc6yffr8dxv.js",
  "/_next/static/chunks/0ni6xu0_390qc.js",
  "/_next/static/chunks/0xwf.9y8g2d_~.js",
  "/_next/static/chunks/05_74ghocpq7_.js",
  "/_next/static/chunks/0d7ky5xpi95-q.js",
  "/_next/static/chunks/07c_fj6-h17yx.js",
  "/_next/static/chunks/0fkpo93mjme9g.js",
]);

export function proxy(request: NextRequest) {
  if (!staleChunkPaths.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const destinationUrl = request.nextUrl.clone();
  destinationUrl.pathname = request.nextUrl.pathname.endsWith(".css")
    ? "/stale-cache-recovery.css"
    : "/stale-cache-recovery.js";

  return NextResponse.redirect(destinationUrl, 307);
}

export const config = {
  matcher: ["/_next/static/chunks/:path*"],
};
