import { Badge, Progress, Stack, Text } from "@mantine/core";
import { useMemo } from "react";

export const ColoredBadge = ({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  thickness?: number;
  label?: string;
}) => {
  const percentage = useMemo(() => {
    return (value / max) * 100;
  }, [value, max]);

  const color = useMemo(() => {
    if (percentage < 30) return "red";
    if (percentage < 60) return "orange";
    if (percentage < 80) return "lime";
    return "green";
  }, [percentage]);

  return (
    <Stack gap="xs">
      <Badge tt="none" color={color}>{`${label}: ${value}`}</Badge>
    </Stack>
  );
};
