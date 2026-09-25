import { ProductSourceType } from "@/models/product-source";
import { axiosInstance } from "../axios-instance";

/**
 * The JSON Schema a product source config is validated against.
 *
 * Fetched rather than bundled, so the editor validates against the same
 * document the backend rejects saves with. A copy kept here would drift the
 * first time an operation is added, and would then be telling people their
 * valid config is invalid — or worse, the reverse.
 *
 * There is one schema PER TYPE, and the type must be passed: "scraping"
 * (startUrls, listPage, detailPage pipelines) and the feed types "arukereso"
 * and "googleshop" (feedUrl, field mapping; one schema for both) share no keys
 * at all. Omitting it returns every schema keyed by
 * type, which is not itself a schema — handing that to the editor validates
 * nothing while looking like it validates everything.
 */
export async function getProductSourceConfigSchema(
  type: ProductSourceType,
): Promise<Record<string, unknown>> {
  try {
    const response = await axiosInstance.get<Record<string, unknown>>(
      "/admin-product-source/config-schema",
      { params: { type } },
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to load the config schema",
    );
  }
}
