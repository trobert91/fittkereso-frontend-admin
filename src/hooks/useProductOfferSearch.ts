import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postProductOfferSearch } from "@/api-actions/product/offer-search";
import {
  OfferSearchParams,
  OfferSearchResult,
} from "@/models/dtos/offer-search-models";

export const useProductOfferSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<OfferSearchResult | null>(
    null
  );

  const search = async (
    productId: string,
    searchParams: OfferSearchParams
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postProductOfferSearch(productId, searchParams);

      if (!response) {
        throw new Error("Failed to search offers");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Offer search failed",
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
