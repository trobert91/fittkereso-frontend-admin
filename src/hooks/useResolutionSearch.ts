import {
  postSearchResolutions,
  ProductResolutionSearchParams,
  ProductResolutionSearchResult,
} from "@/api-actions/product/product-resolutions";
import { useState } from "react";
import { notifications } from "@mantine/notifications";

export const useResolutionSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] =
    useState<ProductResolutionSearchResult | null>(null);

  const searchResolutions = async (
    params: ProductResolutionSearchParams,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postSearchResolutions(params);

      if (!response) {
        throw new Error("Failed to search resolutions");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Resolution search failed",
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    searchResolutions,
    loading,
    error,
    searchResult,
  };
};
