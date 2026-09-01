import { Badge, Group, Tooltip } from "@mantine/core";
import { ResolutionReviewTrigger } from "@/api-actions/product/product-resolutions";
import {
  TRIGGER_COLORS,
  TRIGGER_DESCRIPTIONS,
  TRIGGER_LABELS,
} from "./resolution-labels";

/**
 * Why this row might be wrong, at a glance.
 *
 * Three states, and conflating any two of them would mislead:
 *
 *  - `undefined` — the nightly sweep has not classified this row. Rendered as a
 *    visible "unclassified" chip rather than as nothing, because silence here
 *    reads as "nothing fired", which is the one wrong conclusion: an unclassified
 *    row has not been checked, and no automated path will touch it.
 *  - `[]` — classified, and nothing fired. This is what deterministic
 *    auto-accept trusts, so it is worth stating positively.
 *  - non-empty — the suspicions that matched.
 *
 * The chips carry no count and no ordering weight. Triggers never affect where a
 * row sits in the queue; `priority` alone does that.
 */
export function ResolutionTriggerChips({
  triggers,
  size = "sm",
}: {
  triggers?: ResolutionReviewTrigger[];
  size?: "xs" | "sm";
}) {
  if (!triggers) {
    return (
      <Tooltip
        label="The nightly sweep has not classified this row yet. Until it does, no automated path will act on it."
        withArrow
        multiline
        maw={320}
      >
        <Badge color="gray" variant="outline" size={size} tt="none">
          unclassified
        </Badge>
      </Tooltip>
    );
  }

  if (triggers.length === 0) {
    return (
      <Tooltip
        label="No known suspicion pattern matched. That is not the same as verified correct — it is the absence of the things we know to look for."
        withArrow
        multiline
        maw={320}
      >
        <Badge color="green" variant="light" size={size} tt="none">
          nothing fired
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Group gap={4} wrap="wrap">
      {triggers.map((trigger) => (
        <Tooltip
          key={trigger}
          label={TRIGGER_DESCRIPTIONS[trigger] ?? trigger}
          withArrow
          multiline
          maw={340}
        >
          <Badge
            color={TRIGGER_COLORS[trigger] ?? "gray"}
            variant="light"
            size={size}
            tt="none"
          >
            {TRIGGER_LABELS[trigger] ?? trigger.replace(/_/g, " ")}
          </Badge>
        </Tooltip>
      ))}
    </Group>
  );
}
