import { axiosInstance } from "../axios-instance";

export interface TriggerProductSourceFullSyncResult {
  status: "queued";
}

export interface TriggerProductSourceFullSyncPayload {
  categoryIds?: string[];
}

export async function postTriggerProductSourceFullSync(
  productSourceId: string,
  payload?: TriggerProductSourceFullSyncPayload,
): Promise<TriggerProductSourceFullSyncResult> {
  try {
    const response =
      await axiosInstance.post<TriggerProductSourceFullSyncResult>(
        `/admin-product-source/${productSourceId}/full-sync`,
        payload ?? {},
      );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to trigger product source sync",
    );
  }
}

export async function postTriggerProductSourceIncrementalSync(
  productSourceId: string,
): Promise<TriggerProductSourceFullSyncResult> {
  try {
    const response =
      await axiosInstance.post<TriggerProductSourceFullSyncResult>(
        `/admin-product-source/${productSourceId}/incremental-sync`,
      );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        "Failed to trigger product source incremental sync",
    );
  }
}
