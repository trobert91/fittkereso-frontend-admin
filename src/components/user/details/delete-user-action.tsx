"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { PiTrash } from "react-icons/pi";
import { useAppSelector } from "@/store/store-hooks";
import { selectUserEntity } from "@/store/slices/user-slice";
import { deleteUser } from "@/api-actions/user/user-delete";
import { DetailsSection } from "@/components/details/details-section";
import { routes } from "@/utils/routes";

const CONFIRM_WORD = "delete";

export function DeleteUserAction() {
  const router = useRouter();
  const user = useAppSelector(selectUserEntity);

  const [opened, setOpened] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!user) {
    return null;
  }

  const confirmed = confirmation.trim().toLowerCase() === CONFIRM_WORD;

  const handleClose = () => {
    setOpened(false);
    setConfirmation("");
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(user.id);

      notifications.show({
        title: "Success",
        message: "User deleted",
        color: "green",
      });
      handleClose();
      router.push(routes.users.list);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete user";
      notifications.show({ title: "Error", message, color: "red" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DetailsSection
        title="Danger zone"
        description="Deleting removes the account from Supabase as well. It cannot be undone."
      >
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            {user.email}
          </Text>
          <Button
            color="red"
            variant="light"
            leftSection={<PiTrash size={16} />}
            onClick={() => setOpened(true)}
          >
            Delete user
          </Button>
        </Group>
      </DetailsSection>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Delete this user?"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            This permanently removes <strong>{user.email}</strong> from the
            admin app and from Supabase. They will not be able to sign in
            again.
          </Text>

          <TextInput
            label={`Type "${CONFIRM_WORD}" to confirm`}
            placeholder={CONFIRM_WORD}
            value={confirmation}
            onChange={(event) => setConfirmation(event.currentTarget.value)}
            autoComplete="off"
            data-autofocus
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              color="red"
              disabled={!confirmed}
              loading={deleting}
              onClick={handleDelete}
            >
              Delete user
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
