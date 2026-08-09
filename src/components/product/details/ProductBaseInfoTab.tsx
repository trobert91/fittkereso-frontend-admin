"use client";

import { Controller, useForm } from "react-hook-form";
import { TextInput, NumberInput, Switch, Button, Stack } from "@mantine/core";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  selectProduct,
  selectProductError,
  selectProductLoading,
  updateProduct,
} from "@/store/slices/product-slice";
import { ProductModelUpdateDto } from "@/models/dtos/product-model-update.dto";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";

export const ProductBaseInfoTab = () => {
  const dispatch = useAppDispatch();

  const product = useAppSelector(selectProduct);
  const error = useAppSelector(selectProductError);
  const loading = useAppSelector(selectProductLoading);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<ProductModelUpdateDto>({
    defaultValues: {
      displayName: product?.displayName ?? "",
      model: product?.model ?? "",
      normalizedName: product?.normalizedName ?? "",
      enabled: product?.enabled ?? false,
      releaseYear: product?.releaseYear ?? undefined,
    },
  });

  // Update form when product changes
  useEffect(() => {
    if (product) {
      reset({
        displayName: product.displayName ?? "",
        model: product.model ?? "",
        normalizedName: product.normalizedName ?? "",
        enabled: product.enabled ?? true,
        releaseYear: product.releaseYear ?? undefined,
      });
    }
  }, [product, reset]);

  const onSubmit = async (values: ProductModelUpdateDto) => {
    console.log("Submitting values:", values);
    if (!product) return;

    await dispatch(
      updateProduct({
        id: product.id.toString(),
        data: values,
      })
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
      <Stack gap="md" maw={800}>
        <TextInput
          label="Display Name"
          placeholder="Enter display name"
          {...register("displayName")}
          error={errors.displayName?.message}
        />

        <TextInput
          label="Model Number"
          placeholder="Enter model"
          {...register("model")}
          error={errors.model?.message}
        />

        <TextInput
          label="Normalized Name"
          placeholder="Normalized name"
          {...register("normalizedName")}
          error={errors.normalizedName?.message}
        />

        <Switch
          label="Enabled"
          {...register("enabled")}
          onChange={(e) => setValue("enabled", e.currentTarget.checked)}
        />

        <Controller
          name="releaseYear"
          control={control}
          render={({ field }) => (
            <NumberInput
              label="Release Year"
              {...field}
              value={field.value ?? undefined}
              onChange={(value) => field.onChange(value)}
            />
          )}
        />

        <Button loading={isSubmitting} type="submit" fullWidth>
          Save
        </Button>
      </Stack>
    </form>
  );
};
