import { Badge, Box, Card, Group, Stack, Text } from "@mantine/core";
import { ReactNode } from "react";

export const SectionCard = ({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) => (
  <Card withBorder padding="sm" radius="md">
    <Group justify="space-between" align="center" mb="xs" wrap="nowrap">
      <Text size="sm" fw={600}>
        {title}
      </Text>
      {right}
    </Group>
    {children}
  </Card>
);

export const FieldRow = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <Group gap={6} wrap="nowrap">
    <Text size="xs" c="dimmed" tt="uppercase">
      {label}
    </Text>
    <Text
      size="sm"
      ff={mono ? "monospace" : undefined}
      style={{ wordBreak: "break-word" }}
    >
      {value}
    </Text>
  </Group>
);

export const ChipRow = ({
  label,
  values,
  color,
}: {
  label: string;
  values: string[];
  color: string;
}) => (
  <Box>
    <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
      {label}
    </Text>
    <Group gap={4} wrap="wrap">
      {values.map((value, i) => (
        <Badge
          key={`${value}-${i}`}
          color={color}
          variant="light"
          size="sm"
          tt="none"
          radius="sm"
        >
          {value}
        </Badge>
      ))}
    </Group>
  </Box>
);

export const Stat = ({ label, value }: { label: string; value: string }) => (
  <Stack gap={0} align="flex-end">
    <Text size="xs" c="dimmed" tt="uppercase">
      {label}
    </Text>
    <Text size="sm" fw={600}>
      {value}
    </Text>
  </Stack>
);
