import { Suspense } from "react";
import { Stack, Title, Text } from "@mantine/core";
import { SetPasswordForm } from "./set-password-form";

export const metadata = {
  title: "Choose a password",
};

export default function SetPasswordPage() {
  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Title order={2}>Choose a password</Title>
        <Text size="sm" c="dimmed">
          Your account is on a temporary password. Pick your own to carry on.
        </Text>
      </Stack>

      <Suspense>
        <SetPasswordForm />
      </Suspense>
    </Stack>
  );
}
