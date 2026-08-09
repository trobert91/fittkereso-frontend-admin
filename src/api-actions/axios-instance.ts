import { buildLoginUrl } from "@/utils/routes";
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

let isRefreshing = false;
let failedQueue: {
  resolve: (v: any) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

/**
 * Factory to create Axios instance.
 * @param getServerCookies Optional function to provide cookies on server.
 */
export const createAxiosInstance = (
  getServerCookies?: () => Promise<Record<string, string | undefined>>
) => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor to inject cookies server-side
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (getServerCookies) {
        const cookies = await getServerCookies();
        if (cookies) {
          const cookieHeader = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; ");
          config.headers.set("Cookie", cookieHeader);
        }
      }
      return config;
    }
  );

  // Response interceptor for refresh logic
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        (error.response?.status === 401 || error.response?.status === 403) &&
        !originalRequest._retry &&
        !originalRequest.url.includes("/auth/refresh-token")
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => instance(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await instance.post("/auth/refresh-token", undefined, {
            withCredentials: true,
          });

          isRefreshing = false;
          processQueue(null);

          return instance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError, null);

          if (typeof window !== "undefined") {
            const currentPath =
              window.location.pathname + window.location.search;
            window.location.href = buildLoginUrl(currentPath);
          }

          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// --- Default instance ---
// On server, pass cookies() getter lazily
let axiosInstance: AxiosInstance;

if (typeof window === "undefined") {
  try {
    const { cookies } = await import("next/headers"); // lazy import
    axiosInstance = createAxiosInstance(async () => {
      const cookieStore = await cookies();
      return {
        access_token: cookieStore.get("access_token")?.value,
        refresh_token: cookieStore.get("refresh_token")?.value,
      };
    });
  } catch {
    // fallback
    axiosInstance = createAxiosInstance();
  }
} else {
  // client-side
  axiosInstance = createAxiosInstance();
}

export { axiosInstance };
