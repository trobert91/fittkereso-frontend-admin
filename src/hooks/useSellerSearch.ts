import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postSellerSearch } from "@/api-actions/seller/seller-search";
import {
  SellerSearchParams,
  SellerSearchResult,
} from "@/models/dtos/seller-search-models";

export const useSellerSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SellerSearchResult | null>(
    null
  );

  const search = async (searchParams: SellerSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postSellerSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search sellers");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Seller search failed",
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
