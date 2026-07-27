import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "www.escalavendas.com.br";
const REDIRECT_HOSTS = new Set([
  "escalavendas.com.br",
  "www.escala-growth.escalavendas.com.br",
  "escala-growth.escalavendas.com.br",
]);

function requestHost(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0];
  return (forwardedHost || request.headers.get("host") || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

export function middleware(request: NextRequest) {
  if (!REDIRECT_HOSTS.has(requestHost(request))) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.protocol = "https:";
  destination.host = CANONICAL_HOST;
  destination.port = "";

  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: "/:path*",
};
