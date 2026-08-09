import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postThreadSearch } from "@/api-actions/thread/thread-search";
import {
  ThreadSearchParams,
  ThreadSearchResult,
} from "@/models/dtos/thread-search-models";

export const useThreadSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<ThreadSearchResult | null>(
    null
  );

  const search = async (searchParams: ThreadSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postThreadSearch(searchParams);

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
        message: "Thread search failed",
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
