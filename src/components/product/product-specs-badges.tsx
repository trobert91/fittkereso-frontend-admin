"use no memo";

import { useState } from "react";
import { Badge, Box, Button } from "@mantine/core";
import { isArray } from "lodash";
import { OrderedSpec } from "@/models/product-specs";

const COLLAPSED_COUNT = 4;

export function ProductSpecsBadges({
  specs,
}: {
  specs: OrderedSpec[] | undefined;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!specs || specs.length === 0) return null;

  const visible = expanded ? specs : specs.slice(0, COLLAPSED_COUNT);
  const hasMore = specs.length > COLLAPSED_COUNT;

  return (
    <Box style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: 500 }}>
      {visible.map((spec) => (
        <Badge
          tt="lowercase"
          key={spec.key}
          color="blue"
          variant="light"
          radius="sm"
        >
          {spec.label}:{" "}
          {isArray(spec.value) ? spec.value.join(", ") : spec.value}
        </Badge>
      ))}
      {hasMore && (
        <Button
          size="compact-xs"
          variant="subtle"
          color="blue"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide" : `+${specs.length - COLLAPSED_COUNT} more`}
        </Button>
      )}
    </Box>
  );
}
