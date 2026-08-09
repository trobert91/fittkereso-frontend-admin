import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postThreadSearchKeywordSearch } from "@/api-actions/thread-search-keyword/thread-search-keyword-search";
import {
  ThreadSearchKeywordSearchParams,
  ThreadSearchKeywordSearchResult,
} from "@/models/dtos/thread-search-keyword-search-models";

export const useThreadSearchKeywordSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] =
    useState<ThreadSearchKeywordSearchResult | null>(null);

  const search = async (searchParams: ThreadSearchKeywordSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postThreadSearchKeywordSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search thread search keywords");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Thread search keyword search failed",
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { search, loading, error, searchResult };
};
