import { Stack, Text, Title } from "@mantine/core";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Title order={2}>Reset your password</Title>
        <Text size="sm" c="dimmed">
          We will email you a link to choose a new one.
        </Text>
      </Stack>

      <ForgotPasswordForm />
    </Stack>
  );
}
