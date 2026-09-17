"use client";

import { Badge, Group, Stack, Text } from "@mantine/core";
import { ProductAlias } from "@/models/product-alias";

const SOURCE_COLORS: Record<string, string> = {
  manual: "blue",
  scraped: "gray",
  auto_generated: "teal",
};

export function ProductAliasesSection({ aliases }: { aliases?: ProductAlias[] }) {
  if (!aliases || aliases.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No aliases.
      </Text>
    );
  }
  return (
    <Stack gap="xs">
      {aliases.map((alias) => (
        <Group key={alias.id} gap="sm">
          <Text size="sm" style={{ flex: 1 }}>
            {alias.alias}
          </Text>
          <Badge
            size="xs"
            color={SOURCE_COLORS[alias.source] ?? "gray"}
            variant="light"
          >
            {alias.source}
          </Badge>
        </Group>
      ))}
    </Stack>
  );
}
