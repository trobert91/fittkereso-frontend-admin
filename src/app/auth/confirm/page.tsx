import { Suspense } from "react";
import { Stack, Title } from "@mantine/core";
import { ConfirmRecovery } from "./confirm-recovery";

export const metadata = {
  title: "Confirming your link",
};

export default function ConfirmPage() {
  return (
    <Stack gap="xl">
      <Title order={2}>Confirming your link</Title>

      <Suspense>
        <ConfirmRecovery />
      </Suspense>
    </Stack>
  );
}
