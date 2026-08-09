// components/thread-details/thread-details-hydrator.tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/store-hooks";
import { setThread } from "@/store/slices/thread-slice";
import { Thread } from "@/models/thread";
import { ThreadDetails } from "./ThreadDetails";

export function ThreadDetailsHydrator({ thread }: { thread: Thread }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (thread) dispatch(setThread(thread));
  }, [thread, dispatch]);

  return <ThreadDetails />;
}
