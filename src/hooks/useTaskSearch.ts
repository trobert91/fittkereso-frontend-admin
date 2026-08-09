import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postTaskSearch } from "@/api-actions/task/task-search";
import {
  TaskSearchParams,
  TaskSearchResult,
} from "@/models/dtos/task-search-models";

export const useTaskSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<TaskSearchResult | null>(
    null
  );

  const search = async (searchParams: TaskSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postTaskSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search tasks");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Task search failed",
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
