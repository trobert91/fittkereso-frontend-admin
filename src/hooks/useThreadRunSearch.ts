import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postThreadRunSearch } from "@/api-actions/thread-run/thread-run-search";
import { ThreadRunSearchParams, ThreadRunSearchResult } from "@/models/dtos/thread-run-search-models";

export const useThreadRunSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<ThreadRunSearchResult | null>(null);

  const search = async (searchParams: ThreadRunSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postThreadRunSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search thread runs");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Thread run search failed",
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
