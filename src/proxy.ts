import { NextResponse } from "next/server";
import { auth } from "@/auth";

function construirCSP(nonce: string) {
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
      : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`;

  return `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob:;
    font-src 'self';
    connect-src 'self';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, " ").trim();
}

function aplicarHeadersSeguranca(response: NextResponse, cspHeader: string) {
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export default auth((req) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = construirCSP(nonce);

  const isLoggedIn = !!req.auth;
  const rotasPublicas = ["/login", "/cadastro"];
  const isRotaPublica = rotasPublicas.includes(req.nextUrl.pathname);

  if (!isLoggedIn && !isRotaPublica) {
    const response = NextResponse.redirect(new URL("/login", req.nextUrl));
    return aplicarHeadersSeguranca(response, cspHeader);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return aplicarHeadersSeguranca(response, cspHeader);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icon-192.png|icon-512.png|icon-512-maskable.png).*)"],
};