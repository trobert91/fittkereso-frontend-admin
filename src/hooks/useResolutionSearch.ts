import {
  postSearchResolutions,
  ProductResolutionSearchParams,
  ResolutionListItem,
} from "@/api-actions/product/product-resolutions";
import { useCallback, useEffect, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";

const DEFAULT_PARAMS: ProductResolutionSearchParams = {
  page: 1,
  pageSize: 20,
};

/**
 * Owns the review queue: the search params, the current page of rows, and the
 * ability to replace a single row in place.
 *
 * `replaceItem` exists because a decided row usually falls out of the default
 * open-status filter. Dropping it the instant it is decided makes the list jump
 * under the cursor and takes away the chance to see what happened or re-open a
 * mis-click. So an acted-on row stays until the next `refresh()`.
 */
export const useResolutionSearch = (
  initialParams: ProductResolutionSearchParams = {},
) => {
  const [params, setParamsState] = useState<ProductResolutionSearchParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });
  const [items, setItems] = useState<ResolutionListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against a slow earlier request overwriting a newer one's results
  // when filters are changed in quick succession.
  const requestId = useRef(0);

  const search = useCallback(async (next: ProductResolutionSearchParams) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const response = await postSearchResolutions(next);
      if (id !== requestId.current) return;

      setItems(response.items ?? []);
      setTotalItems(response.totalItems ?? 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      if (id !== requestId.current) return;

      const message = err instanceof Error ? err.message : "An error occurred";
      notifications.show({
        color: "red",
        title: "Resolution search failed",
        message,
      });
      setError(message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(params);
  }, [params, search]);

  /** Merge a filter change. Anything other than paging returns to page 1 —
   *  staying on page 7 of a narrower result set shows an empty queue. */
  const setParams = useCallback((patch: ProductResolutionSearchParams) => {
    setParamsState((current) => {
      const isPaging =
        Object.keys(patch).length > 0 &&
        Object.keys(patch).every((key) => key === "page");
      return { ...current, ...patch, page: isPaging ? patch.page : 1 };
    });
  }, []);

  const refresh = useCallback(() => search(params), [search, params]);

  const replaceItem = useCallback((updated: ResolutionListItem) => {
    setItems((current) =>
      current.map((item) =>
        item.resolution.id === updated.resolution.id ? updated : item,
      ),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.resolution.id !== id));
    setTotalItems((current) => Math.max(current - 1, 0));
  }, []);

  return {
    params,
    setParams,
    items,
    totalItems,
    totalPages,
    loading,
    error,
    refresh,
    replaceItem,
    removeItem,
  };
};
