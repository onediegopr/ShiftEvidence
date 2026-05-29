import { NextResponse, type NextRequest } from "next/server";

const staleChunkRedirects: Record<string, string> = {
  // Compatibility shim for HCDN-cached HTML that references a previous build's chunk names.
  "/_next/static/chunks/0lso1.baz3dt2.css": "/_next/static/chunks/0-v09yv9d6e.7.css",
  "/_next/static/chunks/0h~lqnkna01or.js": "/_next/static/chunks/16xak96v1pi97.js",
  "/_next/static/chunks/04p6trxw0v781.js": "/_next/static/chunks/0i32dnk368pnd.js",
  "/_next/static/chunks/turbopack-0zud-c~c9_rn~.js": "/_next/static/chunks/turbopack-0u7rezf7~4~4i.js",
  "/_next/static/chunks/17wxew6jq_rxj.js": "/_next/static/chunks/01kggotkbtx2n.js",
  "/_next/static/chunks/0e~5fhe0i9.37.js": "/_next/static/chunks/0wmetxjj7wri0.js",
  "/_next/static/chunks/03ns3bn3xpe7f.js": "/_next/static/chunks/0f25ba-.f91m9.js",
  "/_next/static/chunks/0alc6yffr8dxv.js": "/_next/static/chunks/0ytn8xa7gfscp.js",
  "/_next/static/chunks/0ni6xu0_390qc.js": "/_next/static/chunks/13sxrzw6sw_6..js",
  "/_next/static/chunks/0xwf.9y8g2d_~.js": "/_next/static/chunks/120-x-v-kd93x.js",
  "/_next/static/chunks/0r5tu.q7qbgz1.css": "/_next/static/chunks/0-v09yv9d6e.7.css",
  "/_next/static/chunks/05_74ghocpq7_.js": "/_next/static/chunks/0rldy.jjb34_0.js",
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
