import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  fetchCategoryDetails,
  selectCategoryDetailsById,
  selectCategoryDetailsLoading,
} from "@/store/slices/category-slice";

/**
 * Returns the cached full ProductCategory for the given id, fetching it on
 * mount (and whenever the id changes) if the cache is empty or stale. The
 * thunk itself dedupes in-flight requests and skips refetch when fresh.
 */
export const useCategoryDetails = (
  id: string | undefined,
  opts?: { enabled?: boolean },
) => {
  const enabled = opts?.enabled ?? true;
  const dispatch = useAppDispatch();
  const details = useAppSelector(selectCategoryDetailsById(id));
  const loading = useAppSelector(selectCategoryDetailsLoading(id));

  useEffect(() => {
    if (!enabled || !id) return;
    dispatch(fetchCategoryDetails({ id }));
  }, [dispatch, id, enabled]);

  return { details, loading };
};
