import { AuthenticatedUser, LoginResponse } from "@/models/user";
import { axiosInstance } from "./axios-instance";

export interface LoginPayload {
  email: string;
  password: string;
}

export async function postLogin(payload: LoginPayload): Promise<LoginResponse> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.post<LoginResponse>(
      "/auth/login",
      payload
    );

    // The backend sets an HttpOnly cookie automatically
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Login failed:", error?.response?.data || error.message);
    throw new Error(error?.response?.data?.message || "Login failed");
  }
}

export async function postRefreshToken(
  refreshToken: string
): Promise<AuthenticatedUser> {
  try {
    // ⚙️ Call the NestJS refresh token endpoint
    const response = await axiosInstance.post<AuthenticatedUser>(
      "/auth/refresh-token",
      { refreshToken }
    );

    // The backend sets an HttpOnly cookie automatically
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(
      "Refresh token failed:",
      error?.response?.data || error.message
    );
    throw new Error(error?.response?.data?.message || "Refresh token failed");
  }
}

export async function postLogout(): Promise<void> {
  try {
    // ⚙️ Call the NestJS login endpoint
    await axiosInstance.post("/auth/logout");

    // The backend removes the HttpOnly cookie automatically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Logout failed:", error?.response?.data || error.message);
    throw new Error(error?.response?.data?.message || "Logout failed");
  }
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  try {
    const response = await axiosInstance.get<AuthenticatedUser>("/auth/user");

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Fetching current user failed"
    );
  }
}

/**
 * Replaces the caller's own password and lifts any temporary-password hold.
 *
 * The backend issues a fresh session and writes it to the cookies, so the very
 * next request carries a token without the hold - which is what stops the
 * set-password page redirecting to itself.
 */
export async function postSetPassword(password: string): Promise<void> {
  try {
    await axiosInstance.post("/auth/set-password", { password });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Setting the password failed"
    );
  }
}

export interface UpdateMePayload {
  name?: string;
  email?: string;
  currentPassword?: string;
}

export async function patchMe(
  payload: UpdateMePayload
): Promise<AuthenticatedUser> {
  try {
    const response = await axiosInstance.patch<AuthenticatedUser>(
      "/auth/me",
      payload
    );

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Updating profile failed");
  }
}

/**
 * Asks for a password-reset email.
 *
 * Always resolves, and the backend always answers the same way whether or not
 * the address has an account, so nothing here reveals who is registered.
 */
export async function postPasswordReset(email: string): Promise<void> {
  try {
    await axiosInstance.post("/auth/password-reset", { email });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Requesting a password reset failed"
    );
  }
}

/** Exchanges the token hash from a reset link for a real session. */
export async function postVerifyRecovery(tokenHash: string): Promise<void> {
  try {
    await axiosInstance.post("/auth/verify-recovery", { tokenHash });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "That reset link is invalid or expired"
    );
  }
}
