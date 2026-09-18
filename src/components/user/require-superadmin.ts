import { getCurrentUser } from "@/api-actions/auth";
import { hasRole } from "@/models/admin-user";

/**
 * Whether the signed-in account may use user management.
 *
 * Defence in depth. The middleware already redirects, and the API is the real
 * boundary - this just means a page that slipped past the middleware renders
 * a not-found instead of a screen full of failed requests.
 */
export async function requireSuperadmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return hasRole(user.role, "superadmin");
  } catch {
    return false;
  }
}
