"use client";

import { Box, Button, Card, LoadingOverlay, Stack } from "@mantine/core";
import { Review } from "@/models/review";
import { ProductReference } from "@/models/product-reference";
import { ReviewPartItem } from "./review-part-item";
import { useMemo, useState } from "react";
import { compact, orderBy, uniqBy } from "lodash";

type Props = {
  review: Review;
  loading: boolean;
};

export const ReviewExpanded = ({ review, loading }: Props) => {
  const [showAllParts, setShowAllParts] = useState(false);

  // Reviews now carry candidates, not references directly. Each linked
  // candidate's `reference` is the source — walk back through the join, dedupe
  // by reference id (multiple candidates of the same reference might link to
  // this review during transitional states), and sort by relevance like before.
  const orderedReferences = useMemo<ProductReference[]>(() => {
    const candidates = review.candidates ?? [];
    if (candidates.length === 0) return [];

    const references = compact(
      candidates.map((candidate) => candidate.reference),
    );
    const deduped = uniqBy(references, (ref) => ref.id);
    return orderBy(deduped, [(ref) => ref.relevance ?? 0], ["desc"]);
  }, [review.candidates]);

  const visibleReferences = useMemo(() => {
    if (showAllParts) return orderedReferences;
    return orderedReferences.slice(0, 5);
  }, [orderedReferences, showAllParts]);

  const hasMoreParts = orderedReferences.length > 5;

  return (
    <Card.Section withBorder inheritPadding py="md" pos="relative">
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <Stack gap="md">
        {visibleReferences.map((productRef, index) => (
          <Box
            key={productRef.id}
            p="sm"
            style={{
              background: "var(--mantine-color-dark-7)",
              borderRadius: "var(--mantine-radius-md)",
            }}
          >
            <ReviewPartItem productRef={productRef} index={index} />
          </Box>
        ))}
        {hasMoreParts && (
          <Button
            variant="outline"
            color="gray"
            fullWidth
            onClick={() => setShowAllParts((previous) => !previous)}
          >
            {showAllParts
              ? `Hide (showing all ${orderedReferences.length})`
              : `Show all ${orderedReferences.length} parts`}
          </Button>
        )}
      </Stack>
    </Card.Section>
  );
};
