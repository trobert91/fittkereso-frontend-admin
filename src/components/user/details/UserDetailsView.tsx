"use client";

import { ReactNode } from "react";
import { Badge, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { useAppSelector } from "@/store/store-hooks";
import { selectUserEntity } from "@/store/slices/user-slice";
import {
  ROLE_COLORS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from "@/models/admin-user";
import { DetailsSection } from "@/components/details/details-section";
import { formatDate } from "@/utils/date";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

export function UserDetailsView() {
  const user = useAppSelector(selectUserEntity);

  if (!user) {
    return null;
  }

  return (
    <Stack gap="md">
      <DetailsSection
        title="Profile"
        description="Who this account belongs to."
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Field label="Name">
            <Text size="sm">
              {user.name || (
                <Text component="span" size="sm" c="dimmed">
                  Not set
                </Text>
              )}
            </Text>
          </Field>
          <Field label="Email">
            <Text size="sm">{user.email}</Text>
          </Field>
        </SimpleGrid>
      </DetailsSection>

      <DetailsSection
        title="Access"
        description="What this account may do in the admin app."
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Field label="Role">
            <Group gap="xs">
              <Badge color={ROLE_COLORS[user.role]} tt="none">
                {ROLE_LABELS[user.role]}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              {ROLE_DESCRIPTIONS[user.role]}
            </Text>
          </Field>
          <Field label="Password">
            {user.passwordChangeRequired ? (
              <Stack gap={2}>
                <Badge color="orange" tt="none" w="fit-content">
                  Temporary
                </Badge>
                <Text size="xs" c="dimmed">
                  Held at the set-password page until they choose their own.
                </Text>
              </Stack>
            ) : (
              <Text size="sm">Set by the account holder</Text>
            )}
          </Field>
        </SimpleGrid>
      </DetailsSection>

      <DetailsSection title="Activity" description="Identifiers and timestamps.">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Field label="Last sign-in">
            <Text size="sm">
              {user.lastSignInAt ? formatDate(user.lastSignInAt) : "Never"}
            </Text>
          </Field>
          <Field label="Created">
            <Text size="sm">{formatDate(user.createdAt)}</Text>
          </Field>
          <Field label="Supabase auth id">
            <Text size="sm" ff="monospace">
              {user.authUserId}
            </Text>
          </Field>
          <Field label="Updated">
            <Text size="sm">{formatDate(user.updatedAt)}</Text>
          </Field>
        </SimpleGrid>
      </DetailsSection>
    </Stack>
  );
}
