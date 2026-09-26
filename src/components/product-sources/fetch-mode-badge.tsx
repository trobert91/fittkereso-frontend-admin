import { Badge, Tooltip } from "@mantine/core";
import {
  DEFAULT_PRODUCT_SOURCE_FETCH_MODE,
  PRODUCT_SOURCE_FETCH_MODE_COLORS,
  PRODUCT_SOURCE_FETCH_MODE_LABELS,
  PRODUCT_SOURCE_FETCH_MODE_SHORT_LABELS,
  ProductSourceFetchMode,
} from "@/models/product-source";

/** How a source fetches — short on the badge, the full label on hover. */
export function FetchModeBadge({ mode }: { mode?: ProductSourceFetchMode }) {
  const value = mode ?? DEFAULT_PRODUCT_SOURCE_FETCH_MODE;

  return (
    <Tooltip label={PRODUCT_SOURCE_FETCH_MODE_LABELS[value]} withArrow>
      <Badge
        size="sm"
        variant="light"
        color={PRODUCT_SOURCE_FETCH_MODE_COLORS[value]}
        tt="none"
      >
        {PRODUCT_SOURCE_FETCH_MODE_SHORT_LABELS[value]}
      </Badge>
    </Tooltip>
  );
}
