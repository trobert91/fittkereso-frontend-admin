import { postSearchProducts } from "@/api-actions/product/product-search";
import {
  ProductSearchParams,
  ProductSearchResult,
} from "@/models/dtos/product-search-models";
import { useState } from "react";
import { notifications } from "@mantine/notifications";

export const useProductSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<ProductSearchResult | null>(
    null
  );

  const searchProducts = async (searchParams: ProductSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postSearchProducts(searchParams);

      if (!response) {
        throw new Error("Failed to search products");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Product search failed",
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    searchProducts,
    loading,
    error,
    searchResult,
  };
};
