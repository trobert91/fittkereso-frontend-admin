import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { postRefreshToken } from "./api-actions/auth";
import { buildSetPasswordUrl, routes } from "./utils/routes";
import { hasRole, type UserRole } from "./models/admin-user";

/**
 * Supabase JWT verification (matches backend SupabaseJwtService)
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const JWKS_URL = new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
const ISSUER = `${SUPABASE_URL}/auth/v1`;
const jwks = createRemoteJWKSet(JWKS_URL);

// Routes that don’t require authentication
const PUBLIC_PATHS = ["/auth", "/_next", "/static", "/favicon.ico"];

/**
 * Sections that need more than a signed-in account.
 *
 * This is a convenience, not the boundary: the API enforces the same rule and
 * is what actually protects the data. Gating here just means an account that
 * cannot use a page is not shown it and then handed a wall of errors.
 */
const ROLE_GATES: { prefix: string; minRole: UserRole }[] = [
  { prefix: "/users", minRole: "superadmin" },
];

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_MAX_AGE_SECONDS = 14 * 24 * 60 * 60; // 14 days

/**
 * Supabase puts app_metadata straight into the access token, so role and the
 * temporary-password hold are readable from a token we are verifying anyway -
 * no extra round trip. They are a mirror of the database, written whenever the
 * backend changes either, and only ever used for these redirects.
 */
interface SupabaseClaims extends JWTPayload {
  app_metadata?: {
    role?: UserRole;
    password_change_required?: boolean;
  };
}

export const config = {
  matcher: ["/((?!_next|static|favicon\\.ico).*)"],
};

/**
 * Cookie flags shared by both tokens.
 *
 * `secure` is conditional on purpose: with it always on, the browser silently
 * drops these over plain http, so a refresh on localhost would never stick and
 * every navigation would refresh again.
 */
function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Verifies the given JWT and returns its claims, or null when it is not valid.
 */
async function verifyJwt(token?: string): Promise<SupabaseClaims | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: ISSUER });
    return payload as SupabaseClaims;
  } catch {
    return null;
  }
}

/**
 * Redirects to the login page.
 */
function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL(routes.auth.login, request.url));
}

/**
 * Applies the password hold and the role gates to a verified session.
 *
 * Returns a redirect when the request should not proceed, otherwise null.
 */
function gate(request: NextRequest, claims: SupabaseClaims) {
  const { pathname, search } = request.nextUrl;

  if (claims.app_metadata?.password_change_required === true) {
    return NextResponse.redirect(
      new URL(buildSetPasswordUrl(`${pathname}${search}`), request.url)
    );
  }

  const blocked = ROLE_GATES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (blocked && !hasRole(claims.app_metadata?.role, blocked.minRole)) {
    return NextResponse.redirect(new URL(routes.dashboard.root, request.url));
  }

  return null;
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
  const claims = await verifyJwt(accessToken);
  if (claims) {
    return gate(request, claims) ?? NextResponse.next();
  }

  // 2) Try refresh
  if (refreshToken) {
    try {
      const refreshed = await postRefreshToken(refreshToken);

      if (!refreshed?.access_token) {
        return redirectToLogin(request);
      }

      const refreshedClaims = await verifyJwt(refreshed.access_token);
      const response = refreshedClaims
        ? (gate(request, refreshedClaims) ?? NextResponse.next())
        : NextResponse.next();

      response.cookies.set(
        "access_token",
        refreshed.access_token,
        sessionCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS)
      );
      response.cookies.set(
        "refresh_token",
        refreshed.refresh_token,
        sessionCookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS)
      );

      return response;
    } catch {
      return redirectToLogin(request);
    }
  }

  // 3) No refresh → redirect
  return redirectToLogin(request);
}
