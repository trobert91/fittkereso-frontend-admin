import { BaseEntity } from "./base-entity";

/**
 * Access levels, ordered least to most privileged. Mirrors the backend's
 * UserRole enum; ROLE_RANK has to stay in step with it.
 */
export type UserRole = "user" | "admin" | "superadmin";

export const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  admin: 1,
  superadmin: 2,
};

export const USER_ROLES: UserRole[] = ["user", "admin", "superadmin"];

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  admin: "Admin",
  superadmin: "Superadmin",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  user: "Read-only access to the admin app.",
  admin: "Full operational access: products, sellers, scraping, moderation.",
  superadmin: "Everything an admin can do, plus user management.",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  user: "gray",
  admin: "blue",
  superadmin: "red",
};

export function hasRole(role: UserRole | undefined, minRole: UserRole): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

/**
 * An account as user management sees it.
 *
 * Kept apart from AuthenticatedUser in models/user.ts, which is the *session*
 * shape the auth slice stores - these describe the same person but are read in
 * different places and change for different reasons.
 */
export interface AdminUser extends BaseEntity {
  authUserId: string;
  email: string;
  name: string;
  role: UserRole;
  /** True while the account is held on a temporary password. */
  passwordChangeRequired: boolean;
  lastSignInAt?: string | null;
}
