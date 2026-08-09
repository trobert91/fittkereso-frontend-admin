import { useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  CommentSearchParams,
  CommentSearchResult,
} from "@/models/dtos/comment-search-models";
import { postCommentSearch } from "@/api-actions/user-comment/comment-search";

export const useCommentSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<CommentSearchResult | null>(
    null
  );

  const search = async (searchParams: CommentSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postCommentSearch(searchParams);

      if (!response) {
        throw new Error("Failed to search comments");
      }

      setSearchResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Comment search failed",
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
