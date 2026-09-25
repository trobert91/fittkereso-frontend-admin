"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IoIosAdd } from "react-icons/io";
import { postSellerProductSourceCreate } from "@/api-actions/seller/seller-product-source-create";
import {
  PRODUCT_SOURCE_TYPES,
  SellerProductSourceCreateDto,
} from "@/models/dtos/seller-product-source-create.dto";
import {
  isFeedSourceType,
  PRODUCT_SOURCE_TYPE_LABELS,
  ProductSourceType,
} from "@/models/product-source";

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
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SellerProductSourceCreateDto>({
    defaultValues: {
      name: "",
      type: ProductSourceType.scraping,
      identifiesProducts: true,
      hasAllProducts: false,
    },
  });
  const type = watch("type");

  const handleClose = () => {
    setOpened(false);
    reset();
  };

  const onSubmit = async (values: SellerProductSourceCreateDto) => {
    try {
      await postSellerProductSourceCreate(sellerId, {
        ...values,
        hasAllProducts: isFeedSourceType(values.type) && values.hasAllProducts,
      });

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
                    label: PRODUCT_SOURCE_TYPE_LABELS[value],
                  }))}
                  allowDeselect={false}
                  required
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Priority"
                  description="Unique per seller; higher wins field by field. Leave empty to pick one below the seller's lowest."
                  min={0}
                  step={1}
                  allowDecimal={false}
                  value={field.value ?? ""}
                  onChange={(value) =>
                    field.onChange(value === "" ? undefined : Number(value))
                  }
                />
              )}
            />

            <Controller
              name="identifiesProducts"
              control={control}
              render={({ field }) => (
                <Switch
                  label="Identifies products"
                  description="Off: only adds prices, specs and descriptions to the seller's existing offers. A seller's first source must identify."
                  checked={field.value ?? true}
                  onChange={(event) =>
                    field.onChange(event.currentTarget.checked)
                  }
                />
              )}
            />

            <Controller
              name="hasAllProducts"
              control={control}
              render={({ field }) => (
                <Switch
                  label="Has all products"
                  description="Feed sources only: a complete run removes the offers it did not see."
                  disabled={!isFeedSourceType(type)}
                  checked={field.value ?? false}
                  onChange={(event) =>
                    field.onChange(event.currentTarget.checked)
                  }
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
