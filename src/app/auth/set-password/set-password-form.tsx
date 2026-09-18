"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Anchor, Button, PasswordInput, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store/store-hooks";
import { logoutUser } from "@/store/slices/auth-slice";
import { postSetPassword } from "@/api-actions/auth";
import { routes, safeNext } from "@/utils/routes";

/** Stricter than a temporary password: this one is meant to last. */
const MIN_PASSWORD_LENGTH = 8;

interface SetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export function SetPasswordForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetPasswordFormValues>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = async (values: SetPasswordFormValues) => {
    setSubmitting(true);
    try {
      await postSetPassword(values.password);

      notifications.show({
        title: "Success",
        message: "Your password has been set",
        color: "green",
      });

      // The backend swapped the session cookies for ones without the hold, so
      // this navigation is not bounced back here.
      router.push(safeNext(searchParams.get("next")));
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Setting the password failed";
      notifications.show({ title: "Error", message, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await dispatch(logoutUser());
    router.push(routes.auth.login);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="md">
        <PasswordInput
          label="New password"
          placeholder="At least 8 characters"
          withAsterisk
          {...register("password", {
            required: "A password is required",
            minLength: {
              value: MIN_PASSWORD_LENGTH,
              message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            },
          })}
          error={errors.password?.message}
        />

        <PasswordInput
          label="Confirm password"
          placeholder="Repeat the password"
          withAsterisk
          {...register("confirmPassword", {
            required: "Please repeat the password",
            validate: (value) =>
              value === password || "The two passwords do not match",
          })}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" loading={submitting} fullWidth>
          Set password
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          Signed in as the wrong account?{" "}
          <Anchor size="xs" component="button" type="button" onClick={handleSignOut}>
            Sign out
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
