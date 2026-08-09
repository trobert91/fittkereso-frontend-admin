export interface LoginResponse {
  user?: AuthenticatedUser;
  access_token?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
  access_token: string;
  refresh_token: string;
}
