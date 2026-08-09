import {
  postSearchDuplicatePairs,
  ProductDuplicatePairSearchParams,
  ProductDuplicatePairSearchResult,
} from "@/api-actions/product/product-duplicates";
import { useState } from "react";
import { notifications } from "@mantine/notifications";

export const useDuplicateSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] =
    useState<ProductDuplicatePairSearchResult | null>(null);

  const searchDuplicates = async (
    params: ProductDuplicatePairSearchParams,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postSearchDuplicatePairs(params);

      if (!response) {
        throw new Error("Failed to search duplicate pairs");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Duplicate pair search failed",
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    searchDuplicates,
    loading,
    error,
    searchResult,
  };
};
