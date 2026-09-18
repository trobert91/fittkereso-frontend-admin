"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Center, Loader, Stack, Text } from "@mantine/core";
import { PiWarningCircle } from "react-icons/pi";
import { postVerifyRecovery } from "@/api-actions/auth";
import { buildSetPasswordUrl, routes, safeNext } from "@/utils/routes";

const MISSING_TOKEN_MESSAGE =
  "That link is missing its token. Ask for a new one.";

/**
 * Where a password-reset link lands.
 *
 * The token hash is exchanged for a session by our own backend rather than in
 * the browser, because the reset has to finish through our set-password
 * endpoint - that endpoint is the only thing that clears the temporary
 * password hold, and going straight to Supabase would leave it set.
 */
export function ConfirmRecovery() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenHash = searchParams.get("token_hash");
  const next = safeNext(searchParams.get("next"));

  const [exchangeError, setExchangeError] = useState<string | null>(null);
  // A recovery token is single-use, so React's development double-invoke must
  // not spend it twice.
  const exchanged = useRef(false);

  useEffect(() => {
    if (!tokenHash || exchanged.current) return;
    exchanged.current = true;

    postVerifyRecovery(tokenHash)
      .then(() => {
        router.replace(buildSetPasswordUrl(next));
        router.refresh();
      })
      .catch((err: unknown) => {
        setExchangeError(
          err instanceof Error
            ? err.message
            : "That reset link is invalid or expired."
        );
      });
  }, [tokenHash, next, router]);

  // Derived rather than stored: a missing token is a property of the URL, so
  // there is nothing to put in state for it.
  const error = tokenHash ? exchangeError : MISSING_TOKEN_MESSAGE;

  if (error) {
    return (
      <Stack gap="md">
        <Alert
          color="red"
          icon={<PiWarningCircle size={18} />}
          title="This link did not work"
        >
          <Text size="sm">{error}</Text>
        </Alert>
        <Button component="a" href={routes.auth.login} variant="default">
          Back to sign in
        </Button>
      </Stack>
    );
  }

  return (
    <Center p="xl">
      <Loader />
    </Center>
  );
}
