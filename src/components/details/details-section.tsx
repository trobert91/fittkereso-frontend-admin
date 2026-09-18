"use client";

import { ReactNode } from "react";
import { Paper, Stack, Text, Title } from "@mantine/core";

/**
 * One titled block of a details page. A view and its edit form share it so
 * the same fields sit under the same headings in both modes, and switching
 * between them doesn't reshuffle the page.
 */
export function DetailsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <Stack gap={2}>
          <Title order={5}>{title}</Title>
          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}
