import { UserRole } from "./admin-user";

export interface LoginResponse {
  user?: AuthenticatedUser;
  access_token?: string;
}

/**
 * The signed-in session. `id` is the local app_user id, which is also what
 * history rows reference - not the Supabase auth id.
 */
export interface AuthenticatedUser {
  id: string;
  authUserId?: string;
  email: string;
  name?: string;
  role?: UserRole;
  /** True while the account is held on a temporary password. */
  passwordChangeRequired?: boolean;
  access_token: string;
  refresh_token: string;
}
