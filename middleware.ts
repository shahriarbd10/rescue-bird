import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const sessionCookieName = "rb_session";

function isProtected(pathname: string) {
  return pathname.startsWith("/dashboard");
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName)?.value;
  const { pathname } = req.nextUrl;

  if (!isProtected(pathname)) return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
