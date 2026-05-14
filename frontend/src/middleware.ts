import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

// import { NextRequest, NextResponse } from "next/server";

// Token-based route guard. We do NOT verify the JWT here (no DB, no shared
// secret on the frontend) — we only check that the auth cookie is present.
// The backend verifies the token on every API call. If the cookie is forged,
// the API will reject and the user will be bounced back to /login by the
// individual page when its data fetches return 401.
//
// In dev: the backend sets the cookie with Domain=localhost so it's visible
//         to both :4000 (origin) and :3000 (this app's middleware).
// In prod: the backend should set Domain=.yourdomain.com so the cookie is
//          shared between api.yourdomain.com and app.yourdomain.com.
// const COOKIE_NAME = "jewelflow_token";

// const PROTECTED_PREFIXES = [
//   "/dashboard",
//   "/materials",
//   "/vendors",
//   "/issues",
//   "/receives",
//   "/reports",
//   "/reminders",
//   "/settings",
// ];

// export function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;
//   const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
//   if (!isProtected) return NextResponse.next();

//   const token = req.cookies.get(COOKIE_NAME)?.value;
//   if (!token) {
//     const url = req.nextUrl.clone();
//     url.pathname = "/login";
//     url.searchParams.set("redirect", pathname);
//     return NextResponse.redirect(url);
//   }
//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/dashboard/:path*",
//     "/materials/:path*",
//     "/vendors/:path*",
//     "/issues/:path*",
//     "/receives/:path*",
//     "/reports/:path*",
//     "/reminders/:path*",
//     "/settings/:path*",
//   ],
// };
