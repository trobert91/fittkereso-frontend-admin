import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { postUserSearch } from "@/api-actions/user/user-search";
import {
  UserSearchParams,
  UserSearchResult,
} from "@/models/dtos/user-search-models";

export const useUserSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(
    null
  );

  const search = async (searchParams: UserSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postUserSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search users");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "User search failed",
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
