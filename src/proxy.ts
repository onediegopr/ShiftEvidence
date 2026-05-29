import { NextResponse, type NextRequest } from "next/server";

const staleChunkRedirects: Record<string, string> = {
  // Compatibility shim for HCDN-cached HTML that references a previous build's chunk names.
  "/_next/static/chunks/0lso1.baz3dt2.css": "/_next/static/chunks/0-v09yv9d6e.7.css",
  "/_next/static/chunks/0h~lqnkna01or.js": "/_next/static/chunks/16xak96v1pi97.js",
  "/_next/static/chunks/04p6trxw0v781.js": "/_next/static/chunks/0i32dnk368pnd.js",
  "/_next/static/chunks/turbopack-0zud-c~c9_rn~.js": "/_next/static/chunks/turbopack-0u7rezf7~4~4i.js",
  "/_next/static/chunks/17wxew6jq_rxj.js": "/_next/static/chunks/01kggotkbtx2n.js",
};

export function proxy(request: NextRequest) {
  const destinationPath = staleChunkRedirects[request.nextUrl.pathname];

  if (!destinationPath) {
    return NextResponse.next();
  }

  const destinationUrl = request.nextUrl.clone();
  destinationUrl.pathname = destinationPath;

  return NextResponse.redirect(destinationUrl, 307);
}

export const config = {
  matcher: ["/_next/static/chunks/:path*"],
};
