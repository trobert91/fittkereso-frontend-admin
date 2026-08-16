"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IoIosAdd } from "react-icons/io";
import { postSellerProductSourceCreate } from "@/api-actions/seller/seller-product-source-create";
import { SellerProductSourceCreateDto } from "@/models/dtos/seller-product-source-create.dto";

interface CreateProductSourceActionProps {
  sellerId: string;
  onCreated: () => void;
}

export function CreateProductSourceAction({
  sellerId,
  onCreated,
}: CreateProductSourceActionProps) {
  const [opened, setOpened] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SellerProductSourceCreateDto>({
    defaultValues: { name: "" },
  });

  const handleClose = () => {
    setOpened(false);
    reset();
  };

  const onSubmit = async (values: SellerProductSourceCreateDto) => {
    try {
      await postSellerProductSourceCreate(sellerId, values);

      notifications.show({
        title: "Success",
        message: "Product source created",
        color: "green",
      });
      handleClose();
      onCreated();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create product source";
      notifications.show({ title: "Error", message, color: "red" });
    }
  };

  return (
    <>
      <Button
        leftSection={<IoIosAdd size={14} />}
        variant="filled"
        onClick={() => setOpened(true)}
      >
        Add product source
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Add product source"
        centered
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="Enter product source name"
              required
              {...register("name", { required: "Name is required" })}
              error={errors.name?.message}
            />

            <Button type="submit" loading={isSubmitting}>
              Create
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
