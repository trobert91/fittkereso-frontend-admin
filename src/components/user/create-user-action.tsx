"use client";
"use no memo";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import {
  ActionIcon,
  Button,
  CopyButton,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IoIosAdd } from "react-icons/io";
import { IoNavigate } from "react-icons/io5";
import { PiCheck, PiCopy } from "react-icons/pi";
import { postUserCreate } from "@/api-actions/user/user-create";
import {
  MIN_TEMPORARY_PASSWORD_LENGTH,
  UserCreateDto,
} from "@/models/dtos/user-create.dto";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  USER_ROLES,
  UserRole,
} from "@/models/admin-user";
import { generatePassword } from "@/utils/password";
import { routes } from "@/utils/routes";

type CreateUserForm = Omit<UserCreateDto, "role"> & { role: UserRole };

export const CreateUserAction = () => {
  const router = useRouter();

  const [createModalOpened, setCreateModalOpened] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserForm>({
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      // Generated up front rather than revealed afterwards: the superadmin has
      // to read it out to someone, so it needs to be on screen while they are
      // still looking at the form.
      password: generatePassword(),
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch("password");

  const onSubmit = async (values: CreateUserForm, navigate = false) => {
    try {
      const result = await postUserCreate(values);

      notifications.show({
        title: "Success",
        message: "User created successfully",
        color: "green",
      });
      handleClose();

      if (navigate) {
        router.push(routes.users.details(result.id));
      } else {
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create user";
      notifications.show({
        title: "Error",
        message,
        color: "red",
      });
    }
  };

  const handleClose = () => {
    setCreateModalOpened(false);
    // A fresh password for the next account, and the draft discarded.
    reset({ name: "", email: "", role: "user", password: generatePassword() });
  };

  return (
    <>
      <Button
        leftSection={<IoIosAdd size={14} />}
        variant="filled"
        onClick={() => setCreateModalOpened(true)}
      >
        Add user
      </Button>

      <Modal
        opened={createModalOpened}
        onClose={handleClose}
        title="Add new user"
        centered
        size="lg"
      >
        <form>
          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="Enter full name"
              required
              {...register("name", { required: "Name is required" })}
              error={errors.name?.message}
            />

            <TextInput
              label="Email"
              placeholder="name@example.com"
              required
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Enter a valid email address",
                },
              })}
              error={errors.email?.message}
            />

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
                  description={ROLE_DESCRIPTIONS[field.value as UserRole]}
                  error={fieldState.error?.message}
                  allowDeselect={false}
                />
              )}
            />

            <Stack gap={4}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <TextInput
                  label="Temporary password"
                  required
                  style={{ flex: 1 }}
                  // Plain text, not a PasswordInput: the whole point is that
                  // the superadmin can read it and pass it on.
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  // Stops browsers offering to save this as the superadmin's
                  // own password.
                  data-form-type="other"
                  styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)" } }}
                  {...register("password", {
                    required: "A temporary password is required",
                    minLength: {
                      value: MIN_TEMPORARY_PASSWORD_LENGTH,
                      message: `At least ${MIN_TEMPORARY_PASSWORD_LENGTH} characters`,
                    },
                  })}
                  error={errors.password?.message}
                />
                <CopyButton value={password} timeout={1500}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Copied" : "Copy password"}
                      withArrow
                    >
                      <ActionIcon
                        variant="default"
                        size="lg"
                        onClick={copy}
                        aria-label="Copy temporary password"
                      >
                        {copied ? <PiCheck size={16} /> : <PiCopy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
                <Button
                  variant="default"
                  onClick={() =>
                    setValue("password", generatePassword(), {
                      shouldValidate: true,
                    })
                  }
                >
                  Regenerate
                </Button>
              </Group>
              <Text size="xs" c="dimmed">
                Share it with them yourself — no email is sent. They choose
                their own the first time they sign in.
              </Text>
            </Stack>

            <SimpleGrid cols={2}>
              <Button
                loading={isSubmitting}
                onClick={handleSubmit((values) => onSubmit(values, false))}
              >
                Create
              </Button>
              <Button
                leftSection={<IoNavigate size={16} />}
                loading={isSubmitting}
                onClick={handleSubmit((values) => onSubmit(values, true))}
              >
                Create and go to user
              </Button>
            </SimpleGrid>
          </Stack>
        </form>
      </Modal>
    </>
  );
};
