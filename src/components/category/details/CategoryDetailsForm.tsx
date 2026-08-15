"use client";

import { Controller, useForm } from "react-hook-form";
import {
  TextInput,
  Switch,
  Button,
  Stack,
  TagsInput,
  Group,
} from "@mantine/core";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import {
  selectCategory,
  selectCategoryLoading,
  selectCategorySaveInProgress,
  updateCategory,
} from "@/store/slices/category-slice";
import { ProductCategoryUpdateDto } from "@/models/dtos/product-category-update.dto";

export const CategoryDetailsForm = () => {
  const dispatch = useAppDispatch();

  const category = useAppSelector(selectCategory);
  const error = useAppSelector(selectCategoryLoading);
  const saveInProgress = useAppSelector(selectCategorySaveInProgress);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
  } = useForm<ProductCategoryUpdateDto>({
    defaultValues: {
      name: category?.name ?? "",
      enabled: category?.enabled ?? false,
      aliases: category?.aliases ?? [],
    },
  });

  // Update form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name ?? "",
        enabled: category.enabled ?? false,
        aliases: category.aliases ?? [],
      });
    }
  }, [category, reset]);

  const onSubmit = async (values: ProductCategoryUpdateDto) => {
    console.log("Submitting values:", values);
    if (!category) return;

    await dispatch(
      updateCategory({
        id: category.id.toString(),
        data: values,
      }),
    );
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack mx="auto" gap="md" maw={1000} pos="relative">
        <TextInput
          label="Display Name"
          placeholder="Enter display name"
          {...register("name")}
          error={errors.name?.message}
        />

        <Group gap="xl">
          <Switch
            label="Enabled"
            checked={watch("enabled") ?? false}
            onChange={(e) => setValue("enabled", e.currentTarget.checked)}
          />
        </Group>

        <Controller
          name="aliases"
          control={control}
          render={({ field }) => (
            <TagsInput
              label="Aliases"
              description="Alternative names used for product name matching"
              placeholder="Type and press Enter to add"
              value={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />

        {/* Sticky Save Button */}
        <div
          style={{
            position: "sticky",
            bottom: 16,
            zIndex: 3000,
            marginTop: 400,
          }}
        >
          <Button
            loading={isSubmitting || saveInProgress}
            type="submit"
            fullWidth
          >
            Save
          </Button>
        </div>
      </Stack>
    </form>
  );
};
