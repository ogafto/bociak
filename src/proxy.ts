import { NextResponse, type NextRequest } from "next/server";

// Szybkie przekierowanie bez sesji. Właściwa weryfikacja odbywa się w lib/auth.ts.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("bociak_session");
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/panel") && !hasSession) {
    return NextResponse.redirect(new URL("/logowanie", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
