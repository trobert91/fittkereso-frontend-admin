import { Badge, Group, Tooltip } from "@mantine/core";
import { ProductResolutionCandidateRecord } from "@/api-actions/product/product-resolutions";
import { filterReasonLabel } from "./resolution-labels";

export function GateBadges({
  passed,
  failedGates,
  filtered,
}: {
  passed: boolean;
  failedGates: string[];
  filtered?: ProductResolutionCandidateRecord["filtered"];
}) {
  // A filtered candidate never reached the gates — it was excluded on one
  // contradiction before scoring. Saying "N gates failed" would misdescribe
  // that as a close comparison it lost, so the filter reason replaces the gate
  // list entirely rather than sitting alongside it.
  if (filtered) {
    return (
      <Tooltip label={filtered.detail} withArrow multiline maw={320}>
        <Badge color="orange" variant="light" size="sm" tt="none">
          filtered before scoring · {filterReasonLabel(filtered.reason)}
        </Badge>
      </Tooltip>
    );
  }

  if (passed) {
    return (
      <Badge color="green" variant="light" size="sm">
        Passed all gates
      </Badge>
    );
  }

  if (failedGates.length === 0) {
    return (
      <Badge color="red" variant="light" size="sm">
        Not accepted
      </Badge>
    );
  }

  return (
    <Group gap={4} wrap="wrap">
      {failedGates.map((gate) => (
        <Badge key={gate} color="red" variant="light" size="sm">
          {gate.replace(/_/g, " ")}
        </Badge>
      ))}
    </Group>
  );
}
