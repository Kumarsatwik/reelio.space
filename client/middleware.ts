import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/upload", "/profile", "/videos","/watch/*"];
const authPaths = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token");

  // Force authentication for protected routes
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!token?.value) {
      console.log("path", pathname);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      // Clear any existing cookies before redirect
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      response.cookies.delete("refreshToken");
      return response;
    }
  }

  // Prevent authenticated users from accessing auth pages
  if (authPaths.includes(pathname) && token?.value) {
    console.log('prevent')
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
