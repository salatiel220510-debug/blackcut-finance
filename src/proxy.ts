import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const rotasPublicas = ["/login", "/cadastro"];
  const isRotaPublica = rotasPublicas.includes(req.nextUrl.pathname);

  if (!isLoggedIn && !isRotaPublica) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};