"use client";

import { useAppDispatch } from "@/store/store-hooks";
import { LoginForm } from "./login-form";
import { Stack, Title } from "@mantine/core";
import { Suspense, useEffect } from "react";
import { logoutUser } from "@/store/slices/auth-slice";

export default function LoginPage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  return (
    <Stack gap="lg">
      {/* No "OR" divider any more: it separated the heading from the form and nothing else.
          A divider labelled OR promises a second way in - an SSO or magic-link button - and
          there has never been one here. */}
      <Title order={2}>Welcome back</Title>

      <Suspense>
        <LoginForm />
      </Suspense>
    </Stack>
  );
}
