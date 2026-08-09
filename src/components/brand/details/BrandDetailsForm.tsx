"use client";

import { Controller, useForm } from "react-hook-form";
import { TextInput, Button, Stack, TagsInput } from "@mantine/core";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import {
  selectBrand,
  selectBrandLoading,
  selectBrandSaveInProgress,
  updateBrand,
} from "@/store/slices/brand-slice";
import { BrandUpdateDto } from "@/models/dtos/brand-update.dto";

export const BrandDetailsForm = () => {
  const dispatch = useAppDispatch();

  const brand = useAppSelector(selectBrand);
  const error = useAppSelector(selectBrandLoading);
  const saveInProgress = useAppSelector(selectBrandSaveInProgress);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BrandUpdateDto>({
    defaultValues: {
      name: brand?.name ?? "",
      domains: brand?.domains ?? [],
    },
  });

  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name ?? "",
        domains: brand.domains ?? [],
      });
    }
  }, [brand, reset]);

  const onSubmit = async (values: BrandUpdateDto) => {
    if (!brand) return;

    await dispatch(
      updateBrand({
        id: brand.id.toString(),
        data: values,
      })
    );
  };

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
          label="Name"
          placeholder="Enter brand name"
          {...register("name")}
          error={errors.name?.message}
        />

        <Controller
          name="domains"
          control={control}
          render={({ field }) => (
            <TagsInput
              label="Domains"
              description="Website domains associated with this brand"
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
