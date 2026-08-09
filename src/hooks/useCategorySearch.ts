import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postCategorySearch } from "@/api-actions/category/category-search";
import {
  CategorySearchParams,
  CategorySearchResult,
} from "@/models/dtos/category-search-models";

export const useCategorySearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<CategorySearchResult | null>(
    null
  );

  const search = async (searchParams: CategorySearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postCategorySearch(searchParams);

      if (!response) {
        throw new Error("Failed to search categories");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Category search failed",
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
