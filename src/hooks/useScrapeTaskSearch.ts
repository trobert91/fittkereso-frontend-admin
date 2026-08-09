import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postScrapeTaskSearch } from "@/api-actions/scrape-task/scrape-task-search";
import {
  ScrapeTaskSearchParams,
  ScrapeTaskSearchResult,
} from "@/models/dtos/scrape-task-search-models";

export const useScrapeTaskSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] =
    useState<ScrapeTaskSearchResult | null>(null);

  const search = async (searchParams: ScrapeTaskSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postScrapeTaskSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search scrape tasks");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Scrape task search failed",
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
