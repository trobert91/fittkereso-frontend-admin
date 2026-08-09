import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postThreadSearchTaskSearch } from "@/api-actions/thread-search-task/thread-search-task-search";
import {
  ThreadSearchTaskSearchParams,
  ThreadSearchTaskSearchResult,
} from "@/models/dtos/thread-search-task-search-models";

export const useThreadSearchTaskSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] =
    useState<ThreadSearchTaskSearchResult | null>(null);

  const search = async (searchParams: ThreadSearchTaskSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postThreadSearchTaskSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search thread search tasks");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Thread search task search failed",
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { search, loading, error, searchResult };
};
