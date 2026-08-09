import { MantineSize, Progress, Stack, Text } from "@mantine/core";
import { useMemo } from "react";

export const ColoredProgress = ({
  value,
  max = 100,
  size = "xs",
  label,
}: {
  value: number;
  max?: number;
  size?: MantineSize | (string & {}) | number;
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
      {label && (
        <Text size="sm" fw={500}>
          {label}
        </Text>
      )}
      <Progress value={percentage} color={color} size={size} />
    </Stack>
  );
};
