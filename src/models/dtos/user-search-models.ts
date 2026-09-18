import { AdminUser, UserRole } from "../admin-user";
import { BasePageResult } from "./base-page-result";

export interface UserSearchParams {
  /** Matches name or email. */
  searchTerm?: string;
  roles?: UserRole[];
  passwordChangeRequired?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "email" | "name" | "role" | "createdAt" | "lastSignInAt";
  order?: "ASC" | "DESC";
}

export type UserSearchResult = BasePageResult<AdminUser> & {
  searchTerm?: string;
  roles?: UserRole[];
  passwordChangeRequired?: boolean;
};
