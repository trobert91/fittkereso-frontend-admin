import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postProductDuplicateSearch } from "@/api-actions/product-duplicate/product-duplicate-actions";
import {
  ProductDuplicatePairSearchParams,
  ProductDuplicatePairSearchResult,
} from "@/models/dtos/product-duplicate-search-models";

export const useProductDuplicateSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] =
    useState<ProductDuplicatePairSearchResult | null>(null);

  const search = async (searchParams: ProductDuplicatePairSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postProductDuplicateSearch(searchParams);

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
    search,
    loading,
    error,
    searchResult,
  };
};
