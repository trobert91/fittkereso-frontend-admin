"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button, Modal, Select, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IoIosAdd } from "react-icons/io";
import { postSellerProductSourceCreate } from "@/api-actions/seller/seller-product-source-create";
import {
  PRODUCT_SOURCE_TYPES,
  SellerProductSourceCreateDto,
} from "@/models/dtos/seller-product-source-create.dto";
import { ProductSourceType } from "@/models/product-source";

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
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SellerProductSourceCreateDto>({
    defaultValues: { name: "", type: ProductSourceType.scraping },
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

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  label="Type"
                  description="Cannot be changed later — each type has its own config format."
                  data={PRODUCT_SOURCE_TYPES.map((value) => ({
                    value,
                    label:
                      value === ProductSourceType.scraping
                        ? "Scraping — page pipelines"
                        : "Árukereső — product feed",
                  }))}
                  allowDeselect={false}
                  required
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              )}
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
