import { axiosInstance } from "../axios-instance";
import {
  ProductSourceRecordList,
  ProductSourceRecordQuery,
} from "@/models/dtos/product-source-record-models";

/**
 * A source's listings, newest sighting first. `attached: false` gives the ones
 * waiting unattached: rows of a source that does not identify products, whose
 * offer the seller's identifying source has not written yet.
 */
export async function getProductSourceRecords(
  id: string,
  query: ProductSourceRecordQuery,
): Promise<ProductSourceRecordList> {
  try {
    const response = await axiosInstance.get<ProductSourceRecordList>(
      `/admin-product-source/${id}/records`,
      { params: query },
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to load the source's listings",
    );
  }
}
