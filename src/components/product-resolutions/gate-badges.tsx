import { Badge, Group } from "@mantine/core";

export function GateBadges({
  passed,
  failedGates,
}: {
  passed: boolean;
  failedGates: string[];
}) {
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
