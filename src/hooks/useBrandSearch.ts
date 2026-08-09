import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postBrandSearch } from "@/api-actions/brand/brand-search";
import {
  BrandSearchParams,
  BrandSearchResult,
} from "@/models/dtos/brand-search-models";

export const useBrandSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<BrandSearchResult | null>(
    null
  );

  const search = async (searchParams: BrandSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postBrandSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search brands");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Brand search failed",
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
