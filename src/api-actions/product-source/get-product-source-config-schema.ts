import { axiosInstance } from "../axios-instance";

/**
 * The JSON Schema every product source config is validated against.
 *
 * Fetched rather than bundled, so the editor validates against the same
 * document the backend rejects saves with. A copy kept here would drift the
 * first time an operation is added, and would then be telling people their
 * valid config is invalid — or worse, the reverse.
 */
export async function getProductSourceConfigSchema(): Promise<
  Record<string, unknown>
> {
  try {
    const response = await axiosInstance.get<Record<string, unknown>>(
      "/admin-product-source/config-schema",
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to load the config schema",
    );
  }
}
