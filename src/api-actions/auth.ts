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
