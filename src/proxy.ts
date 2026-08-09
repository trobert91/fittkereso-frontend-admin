import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { postRefreshToken } from "./api-actions/auth";
import { routes } from "./utils/routes";

/**
 * Supabase JWT verification (matches backend SupabaseJwtService)
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const JWKS_URL = new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
const ISSUER = `${SUPABASE_URL}/auth/v1`;
const jwks = createRemoteJWKSet(JWKS_URL);

// Routes that don’t require authentication
const PUBLIC_PATHS = ["/auth", "/_next", "/static", "/favicon.ico"];

export const config = {
  matcher: ["/((?!_next|static|favicon\\.ico).*)"],
};

/**
 * Verifies the given JWT token using Supabase's JWK set.
 */
async function verifyJwt(token?: string): Promise<boolean> {
  if (!token) return false;

  try {
    await jwtVerify(token, jwks, { issuer: ISSUER });
    return true;
  } catch {
    return false;
  }
}

/**
 * Redirects to the login page.
 */
function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL(routes.auth.login, request.url));
}

/**
 * Main proxy middleware protecting all routes.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // 1) If access token is valid — continue
  if (await verifyJwt(accessToken)) {
    return NextResponse.next();
  }

  // 2) Try refresh
  if (refreshToken) {
    console.log(
      "Access token expired, attempting to refresh with refresh token " +
        refreshToken
    );
    try {
      const refreshed = await postRefreshToken(refreshToken);

      if (!refreshed) {
        console.log(
          "Refresh token invalid, redirecting to login: " +
            JSON.stringify(refreshed)
        );
        return redirectToLogin(request);
      }

      console.log("Refreshed tokens: " + JSON.stringify(refreshed));

      const response = NextResponse.next();

      response.cookies.set("access_token", refreshed.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });

      response.cookies.set("refresh_token", refreshed.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });

      return response;
    } catch (e) {
      console.error(e);
      return redirectToLogin(request);
    }
  }

  console.log("No valid access or refresh token found.");
  // 3) No refresh → redirect
  return redirectToLogin(request);
}
