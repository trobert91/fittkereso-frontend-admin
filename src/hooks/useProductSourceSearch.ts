import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postProductSourceSearch } from "@/api-actions/product-source/product-source-search";
import {
  ProductSourceSearchParams,
  ProductSourceSearchResult,
} from "@/models/dtos/product-source-search-models";

export const useProductSourceSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] =
    useState<ProductSourceSearchResult | null>(null);

  const search = async (searchParams: ProductSourceSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postProductSourceSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search product sources");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Product source search failed",
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
