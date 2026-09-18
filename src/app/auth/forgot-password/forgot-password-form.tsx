"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Alert, Anchor, Button, Stack, TextInput } from "@mantine/core";
import { PiEnvelopeSimple } from "react-icons/pi";
import { postPasswordReset } from "@/api-actions/auth";
import { routes } from "@/utils/routes";

interface ForgotPasswordFormValues {
  email: string;
}

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ defaultValues: { email: "" } });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setSubmitting(true);
    try {
      await postPasswordReset(values.email);
    } catch {
      // Swallowed deliberately: the confirmation below is identical either
      // way, so that this page cannot be used to find out who has an account.
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <Stack gap="md">
        <Alert color="blue" icon={<PiEnvelopeSimple size={18} />} title="Check your inbox">
          If that address has an account, a reset link is on its way. The link
          can only be used once.
        </Alert>
        <Anchor component={Link} href={routes.auth.login} size="sm">
          Back to sign in
        </Anchor>
      </Stack>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Email"
          placeholder="you@example.com"
          withAsterisk
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Please enter a valid email address",
            },
          })}
          error={errors.email?.message}
        />

        <Button type="submit" loading={submitting} fullWidth>
          Send reset link
        </Button>

        <Anchor component={Link} href={routes.auth.login} size="sm" ta="center">
          Back to sign in
        </Anchor>
      </Stack>
    </form>
  );
}
