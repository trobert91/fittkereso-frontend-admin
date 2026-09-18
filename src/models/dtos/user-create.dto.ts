import { UserRole } from "../admin-user";

/** Minimum the backend accepts for a temporary password. */
export const MIN_TEMPORARY_PASSWORD_LENGTH = 6;

export interface UserCreateDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}
