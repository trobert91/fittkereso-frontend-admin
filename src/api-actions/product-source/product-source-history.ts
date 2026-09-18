import { axiosInstance } from "../axios-instance";
import { ProductSource } from "@/models/dtos/product-source-search-models";

/**
 * Puts an earlier config back, as a NEW version.
 *
 * Addressed by the version being restored FROM. Restoring v2 while v5 is in
 * force produces v6 carrying v2's config — v2 and v5 both stay in the history.
 *
 * Answers with the whole source, history included, because a restore changes
 * both the config in force and the history — so the page re-renders from this
 * rather than going back for either.
 *
 * The only history call the admin makes. READING it is not one: the details,
 * update and restore responses all carry the versions and the trail, so there
 * is nothing to fetch and no window in which a panel shows what a save has
 * already replaced. The backend's paged list endpoints still exist for going
 * further back than one response carries.
 */
export async function restoreProductSourceVersion(
  id: string,
  version: number,
): Promise<ProductSource> {
  try {
    const response = await axiosInstance.post<ProductSource>(
      `/admin-product-source/${id}/versions/${version}/restore`,
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || `Failed to restore version ${version}`,
    );
  }
}
