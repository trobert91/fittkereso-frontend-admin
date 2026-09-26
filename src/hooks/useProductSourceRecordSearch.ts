import { useCallback, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import { postProductSourceRecordSearch } from "@/api-actions/product-source-record/product-source-record-actions";
import {
  ProductSourceRecordSearchParams,
  ProductSourceRecordSearchResult,
} from "@/models/dtos/product-source-record-models";

/**
 * Searches listings. Only the latest request's answer lands: typing into a
 * filter fires several searches, and an older one answering last would show
 * rows for a filter that is no longer set.
 */
export const useProductSourceRecordSearch = () => {
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] =
    useState<ProductSourceRecordSearchResult | null>(null);
  const latestRequest = useRef(0);

  const search = useCallback(
    async (params: ProductSourceRecordSearchParams) => {
      const request = ++latestRequest.current;
      setLoading(true);

      try {
        const result = await postProductSourceRecordSearch(params);
        if (request === latestRequest.current) setSearchResult(result);
      } catch (err) {
        if (request !== latestRequest.current) return;
        notifications.show({
          color: "red",
          title: err instanceof Error ? err.message : "An error occurred",
          message: "Listing search failed",
        });
      } finally {
        if (request === latestRequest.current) setLoading(false);
      }
    },
    [],
  );

  return { search, loading, searchResult };
};
