import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

const privatePrefixes = ["/dashboard", "/projects"];
const publicOnlyPaths = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    return NextResponse.next({ request });
  }

  const { response, claims } = await updateSession(request);
  const privatePath = privatePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (privatePath && !claims?.sub) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  if (claims?.sub && publicOnlyPaths.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
