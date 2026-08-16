"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { Button, Modal, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { IoIosAdd } from "react-icons/io";
import { IoNavigate } from "react-icons/io5";
import { postSellerCreate } from "@/api-actions/seller/seller-create";
import { SellerCreateDto } from "@/models/dtos/seller-create.dto";
import { routes } from "@/utils/routes";

export const CreateSellerAction = () => {
  const router = useRouter();

  const [createModalOpened, setCreateModalOpened] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SellerCreateDto>({
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (
    values: SellerCreateDto,
    navigate: boolean = false
  ) => {
    try {
      const result = await postSellerCreate(values);

      notifications.show({
        title: "Success",
        message: "Seller created successfully",
        color: "green",
      });
      handleClose();

      if (navigate) {
        router.push(routes.sellers.details(result.id));
      } else {
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create seller";
      notifications.show({
        title: "Error",
        message,
        color: "red",
      });
    }
  };

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
      >
        Add seller
      </Button>

      <Modal
        opened={createModalOpened}
        onClose={handleClose}
        title="Add new seller"
        centered
        size="lg"
      >
        <form>
          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="Enter seller name"
              required
              {...register("name", { required: "Name is required" })}
              error={errors.name?.message}
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
                Create and go to seller
              </Button>
            </SimpleGrid>
          </Stack>
        </form>
      </Modal>
    </>
  );
};
