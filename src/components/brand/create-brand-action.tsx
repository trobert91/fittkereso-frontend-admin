"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import {
  Button,
  Modal,
  SimpleGrid,
  Stack,
  TagsInput,
  TextInput,
} from "@mantine/core";
import { IoIosAdd } from "react-icons/io";
import { IoNavigate } from "react-icons/io5";
import { postBrandCreate } from "@/api-actions/brand/brand-create";
import { BrandCreateDto } from "@/models/dtos/brand-create.dto";
import { routes } from "@/utils/routes";

export const CreateBrandAction = () => {
  const router = useRouter();

  const [createModalOpened, setCreateModalOpened] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BrandCreateDto>({
    defaultValues: {
      name: "",
      domains: [],
    },
  });

  const onSubmit = async (
    values: BrandCreateDto,
    navigate: boolean = false
  ) => {
    try {
      const result = await postBrandCreate(values);

      notifications.show({
        title: "Success",
        message: "Brand created successfully",
        color: "green",
      });
      handleClose();

      if (navigate) {
        router.push(routes.brands.details(result.id));
      } else {
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create brand";
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
        Add brand
      </Button>

      <Modal
        opened={createModalOpened}
        onClose={handleClose}
        title="Add new brand"
        centered
        size="lg"
      >
        <form>
          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="Enter brand name"
              required
              {...register("name", { required: "Name is required" })}
              error={errors.name?.message}
            />

            <Controller
              name="domains"
              control={control}
              render={({ field }) => (
                <TagsInput
                  label="URLs"
                  description="Website domains associated with this brand"
                  placeholder="Type and press Enter to add"
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              )}
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
                Create and go to brand
              </Button>
            </SimpleGrid>
          </Stack>
        </form>
      </Modal>
    </>
  );
};
