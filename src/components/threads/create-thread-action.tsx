"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppSelector } from "@/store/store-hooks";
import {
  selectThreadError,
  selectThreadLoading,
} from "@/store/slices/thread-slice";
import { notifications } from "@mantine/notifications";
import { routes } from "@/utils/routes";
import { useRouter } from "next/navigation";
import { postCreateThread } from "@/api-actions/thread/create-thread";
import { Button, Modal, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { IoIosAdd } from "react-icons/io";
import { IoNavigate } from "react-icons/io5";

interface CreateThreadFormValues {
  id: string;
}

export const CreateThreadAction = () => {
  const router = useRouter();

  const [createModalOpened, setCreateModalOpened] = useState(false);

  const error = useAppSelector(selectThreadError);
  const loading = useAppSelector(selectThreadLoading);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateThreadFormValues>({
    defaultValues: {
      id: "",
    },
  });

  const onSubmit = async (
    values: CreateThreadFormValues,
    navigate: boolean = false
  ) => {
    const result = await postCreateThread({
      externalId: values.id,
    });

    notifications.show({
      title: "Success",
      message: "Thread created successfully",
      color: "green",
    });
    handleClose();

    if (navigate) {
      router.push(routes.threads.details(result.id));
    } else {
    }
  };

  // Show notification if error occurs
  useEffect(() => {
    if (error) {
      notifications.show({
        title: "Error",
        message: error,
        color: "red",
      });
    }
  }, [error]);

  const handleClose = () => {
    setCreateModalOpened(false);
    reset();
  };

  return (
    <>
      <Button
        leftSection={<IoIosAdd size={14} />}
        variant="filled"
        onClick={() => setCreateModalOpened(true)}
        loading={loading}
      >
        Add thread
      </Button>

      <Modal
        opened={createModalOpened}
        onClose={handleClose}
        title="Add new thread"
        centered
        size="lg"
      >
        <form>
          <Stack gap="md">
            <TextInput
              label="ID"
              placeholder="Enter thread ID"
              {...register("id")}
              error={errors.id?.message}
            />

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
                Create and go to thread
              </Button>
            </SimpleGrid>
          </Stack>
        </form>
      </Modal>
    </>
  );
};
