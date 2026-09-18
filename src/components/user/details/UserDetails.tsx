"use client";

import { useState } from "react";
import { Badge, Button, Group, Stack } from "@mantine/core";
import { PiPencilSimple, PiX } from "react-icons/pi";
import { useAppSelector } from "@/store/store-hooks";
import { selectUserEntity, selectUserLoading } from "@/store/slices/user-slice";
import { selectUser as selectSignedInUser } from "@/store/slices/auth-slice";
import { ROLE_COLORS, ROLE_LABELS } from "@/models/admin-user";
import { CopyIdBadge } from "@/components/copy-id-badge";
import { UserDetailsView } from "./UserDetailsView";
import { UserDetailsForm } from "./UserDetailsForm";
import { DeleteUserAction } from "./delete-user-action";

export function UserDetails() {
  const user = useAppSelector(selectUserEntity);
  const loading = useAppSelector(selectUserLoading);
  const signedInUser = useAppSelector(selectSignedInUser);

  // Which account the edit form is open for, rather than a bare boolean:
  // navigating to a different user then leaves edit mode on its own, with no
  // effect needed to reset it.
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!user) {
    return <div>Loading...</div>;
  }

  const isSelf = signedInUser?.id === user.id;
  const editing = editingId === user.id;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <CopyIdBadge id={user.id} />
          <Badge color={ROLE_COLORS[user.role]} tt="none">
            {ROLE_LABELS[user.role]}
          </Badge>
          {user.passwordChangeRequired && (
            <Badge color="orange" tt="none">
              Temporary password
            </Badge>
          )}
          {isSelf && (
            <Badge color="gray" variant="outline" tt="none">
              This is you
            </Badge>
          )}
        </Group>

        <Button
          variant={editing ? "default" : "filled"}
          leftSection={<PiPencilSimple size={16} />}
          rightSection={editing ? <PiX size={14} /> : undefined}
          onClick={() => setEditingId(editing ? null : user.id)}
          disabled={loading}
        >
          {editing ? "Cancel" : "Edit"}
        </Button>
      </Group>

      {editing ? (
        <UserDetailsForm onSaved={() => setEditingId(null)} />
      ) : (
        <UserDetailsView />
      )}

      {/*
        Omitted entirely when looking at your own account: the API refuses it
        with a conflict, and offering a button that can only fail is worse
        than not offering one.
      */}
      {!isSelf && <DeleteUserAction />}
    </Stack>
  );
}
