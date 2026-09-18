"use client";
"use no memo";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  selectUserEntity,
  selectUserError,
  selectUserLoading,
  updateUser,
} from "@/store/slices/user-slice";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  USER_ROLES,
  UserRole,
} from "@/models/admin-user";
import { UserUpdateDto } from "@/models/dtos/user-update.dto";
import { DetailsSection } from "@/components/details/details-section";

interface UserFormValues {
  name: string;
  email: string;
  role: UserRole;
  passwordChangeRequired: boolean;
}

/**
 * Builds the patch from what actually changed.
 *
 * Sending the whole record would break accounts with no name: the API rejects
 * a blank one, so a role change on such an account would be refused for a
 * field nobody touched.
 */
function toUserPatch(
  initial: UserFormValues,
  values: UserFormValues
): UserUpdateDto {
  const patch: UserUpdateDto = {};

  if (values.name !== initial.name) patch.name = values.name.trim();
  if (values.email !== initial.email) patch.email = values.email.trim();
  if (values.role !== initial.role) patch.role = values.role;
  if (values.passwordChangeRequired !== initial.passwordChangeRequired) {
    patch.passwordChangeRequired = values.passwordChangeRequired;
  }

  return patch;
}

export function UserDetailsForm({ onSaved }: { onSaved?: () => void }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserEntity);
  const loading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);

  const initialValues: UserFormValues = {
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "user",
    passwordChangeRequired: user?.passwordChangeRequired ?? false,
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({ defaultValues: initialValues });

  // Re-seed whenever the loaded account changes, so reopening the form after a
  // save shows what the server actually stored.
  useEffect(() => {
    if (user) {
      reset({
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role,
        passwordChangeRequired: user.passwordChangeRequired,
      });
    }
  }, [user, reset]);

  useEffect(() => {
    if (error) {
      notifications.show({ title: "Error", message: error, color: "red" });
    }
  }, [error]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const values = watch();
  const patch = toUserPatch(initialValues, values);
  const dirty = Object.keys(patch).length > 0;

  const onSubmit = async (submitted: UserFormValues) => {
    if (!user) return;

    const changes = toUserPatch(initialValues, submitted);
    if (Object.keys(changes).length === 0) {
      return;
    }

    const result = await dispatch(
      updateUser({ id: user.id, data: changes })
    );

    if (updateUser.fulfilled.match(result)) {
      notifications.show({
        title: "Success",
        message: "User updated successfully",
        color: "green",
      });
      onSaved?.();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="md">
        <DetailsSection
          title="Profile"
          description="Who this account belongs to."
        >
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Name"
              placeholder="Full name"
              {...register("name", {
                validate: (value) =>
                  value.trim().length > 0 || "Name cannot be empty",
              })}
              error={errors.name?.message}
            />
            <TextInput
              label="Email"
              placeholder="name@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Enter a valid email address",
                },
              })}
              error={errors.email?.message}
            />
          </SimpleGrid>
        </DetailsSection>

        <DetailsSection
          title="Access"
          description="Changing a role takes effect on their next request."
        >
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Controller
              name="role"
              control={control}
              rules={{ required: "Role is required" }}
              render={({ field, fieldState }) => (
                <Select
                  label="Role"
                  required
                  data={USER_ROLES.map((role) => ({
                    value: role,
                    label: ROLE_LABELS[role],
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  description={ROLE_DESCRIPTIONS[field.value]}
                  error={fieldState.error?.message}
                  allowDeselect={false}
                />
              )}
            />

            <Controller
              name="passwordChangeRequired"
              control={control}
              render={({ field }) => (
                <Switch
                  label="Hold on a temporary password"
                  description="While on, they can only reach the set-password page."
                  checked={field.value}
                  onChange={(event) =>
                    field.onChange(event.currentTarget.checked)
                  }
                  mt="md"
                />
              )}
            />
          </SimpleGrid>
        </DetailsSection>

        {/* Sticky save bar - the z-index stays below Mantine's floating layers
            (popover 300, modal 200), or it covers the Role select's dropdown, which
            opens downward right onto it. 2 is all it needs to clear the sections. */}
        <div
          style={{
            position: "sticky",
            bottom: 16,
            zIndex: 2,
            marginTop: 24,
          }}
        >
          <Button
            loading={isSubmitting || loading}
            disabled={!dirty}
            type="submit"
            fullWidth
          >
            {dirty ? "Save" : "No changes"}
          </Button>
        </div>
      </Stack>
    </form>
  );
}
