"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { postProductDuplicateScan } from "@/api-actions/product-duplicate/product-duplicate-actions";

/** Starts a background scan of every product for possible duplicates. */
export function ProductDuplicateScanAction() {
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    try {
      const result = await postProductDuplicateScan();
      const started = "started" in result && result.started;
      notifications.show({
        color: started ? "green" : "yellow",
        title: started ? "Duplicate scan started" : "A scan is already running",
        message: started
          ? "New pairs appear here as the scan finds them."
          : "Try again once it has finished.",
      });
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Scan failed to start",
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="light" loading={loading} onClick={handleScan}>
      Rescan all
    </Button>
  );
}
