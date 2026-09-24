import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postProductImportTaskSearch } from "@/api-actions/product-import-task/product-import-task-search";
import {
  ProductImportTaskSearchParams,
  ProductImportTaskSearchResult,
} from "@/models/dtos/product-import-task-search-models";

export const useProductImportTaskSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] =
    useState<ProductImportTaskSearchResult | null>(null);

  const search = async (searchParams: ProductImportTaskSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postProductImportTaskSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search import tasks");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Import task search failed",
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
