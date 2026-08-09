import { RingProgress, Text } from "@mantine/core";
import { useMemo } from "react";

export const ColoredRating = ({
  value,
  size = 50,
  thickness = 6,
}: {
  value: number | null | undefined;
  size?: number;
  thickness?: number;
}) => {
  const color = useMemo(() => {
    if (value == null) return "gray";
    if (value < 30) return "red";
    if (value < 60) return "orange";
    if (value < 80) return "lime";
    return "green";
  }, [value]);

  if (value == null) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        —
      </Text>
    );
  }

  return (
    <RingProgress
      sections={[{ value, color }]}
      label={
        <Text c={color} fw={700} ta="center" size="sm">
          {value}
        </Text>
      }
      size={size}
      thickness={thickness}
    />
  );
};
