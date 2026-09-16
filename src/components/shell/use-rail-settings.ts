"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "@mantine/hooks";

export const RAIL_FLOATING_KEY = "fittkereso-admin-rail-floating";

/**
 * Whether the menu floats, remembered across sessions.
 *
 * Floating (the default) is the collapsed rail: 64px of icons that widen over the page on
 * hover, so the content keeps a constant offset and nothing reflows. Not floating pins it
 * open as a real column that pushes the content across.
 *
 * localStorage rather than control-plane's cookie, because that choice was forced by their
 * shell being a server component that had to know the width before the first paint. This one
 * is already a client component, so there is no server render to inform.
 *
 * `ready` is what that costs. The stored value only arrives after mount, so the width
 * transition stays switched off until it does - otherwise a pinned menu would visibly slide
 * open on every single page load.
 */
export function useRailFloating() {
  const [floating, setFloating] = useLocalStorage<boolean>({
    key: RAIL_FLOATING_KEY,
    defaultValue: true,
    getInitialValueInEffect: true,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  return { floating, setFloating, ready };
}
