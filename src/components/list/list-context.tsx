"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface ListState {
  /** null while the first search is still in flight - distinct from a genuine zero. */
  totalItems: number | null;
  loading: boolean;
  refresh: (() => void) | null;
}

const EMPTY: ListState = { totalItems: null, loading: false, refresh: null };

const ListContext = createContext<{
  state: ListState;
  register: (state: ListState) => void;
} | null>(null);

/** Read by the page header. Safe outside a ListPage - it just reports nothing to show. */
export function useListState(): ListState {
  return useContext(ListContext)?.state ?? EMPTY;
}

export function ListStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ListState>(EMPTY);

  const register = useCallback((next: ListState) => {
    // Bail when nothing changed. The registering effect below runs on every count/loading
    // change, and without this a table whose search returns identical numbers would set
    // state, re-render, and set it again.
    setState((prev) =>
      prev.totalItems === next.totalItems &&
      prev.loading === next.loading &&
      prev.refresh === next.refresh
        ? prev
        : next
    );
  }, []);

  const value = useMemo(() => ({ state, register }), [state, register]);

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
}

/**
 * Published by a list table so the page header can show the count and a refresh button.
 *
 * The header sits in page.tsx while the number and the search function both live inside the
 * table component, so something has to carry them up. A context rather than prop drilling
 * because the table is rendered as an opaque child - page.tsx says <BrandTable /> and has no
 * idea what is inside it.
 *
 * onRefresh is held in a ref and wrapped, so callers can pass a fresh arrow function on every
 * render without that counting as a change and re-triggering the effect. The wrapper itself is
 * created once.
 */
export function useListRegistration({
  totalItems,
  loading,
  onRefresh,
}: {
  totalItems: number | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const ctx = useContext(ListContext);
  const onRefreshRef = useRef(onRefresh);

  // Assigned in an effect rather than during render. Mutating a ref while rendering is what
  // react-hooks/refs forbids, and the rule is right: under concurrent rendering a render pass
  // can be thrown away, so a write made during one is not guaranteed to have happened. No
  // dependency array, so this tracks every committed render.
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  const refresh = useCallback(() => onRefreshRef.current(), []);
  const register = ctx?.register;

  useEffect(() => {
    register?.({ totalItems, loading, refresh });
  }, [register, totalItems, loading, refresh]);
}
