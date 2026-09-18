import { UserRole } from "../admin-user";

/**
 * Every field optional: only what changed is sent.
 *
 * The API rejects a blank name, and an account can legitimately have one, so
 * resending the whole record would block a role change on such an account.
 */
export interface UserUpdateDto {
  name?: string;
  email?: string;
  role?: UserRole;
  passwordChangeRequired?: boolean;
}
