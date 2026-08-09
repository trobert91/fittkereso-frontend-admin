"use client";

import { useAppDispatch } from "@/store/store-hooks";
import { LoginForm } from "./login-form";
import { Divider, Stack, Title } from "@mantine/core";
import { Suspense, useEffect } from "react";
import { logoutUser } from "@/store/slices/auth-slice";

export default function LoginPage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  return (
    <Stack gap="xl">
      <Stack>
        <Title order={2}>Welcome back! Please sign in to continue.</Title>
      </Stack>

      <Divider label="OR" labelPosition="center" />

      <Suspense>
        <LoginForm />
      </Suspense>
    </Stack>
  );
}
