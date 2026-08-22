"use client";

import { Controller, useForm } from "react-hook-form";
import {
  TextInput,
  Button,
  Stack,
  TagsInput,
  Select,
  Switch,
  Group,
  NumberInput,
} from "@mantine/core";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import {
  selectSeller,
  selectSellerLoading,
  selectSellerSaveInProgress,
  updateSeller,
} from "@/store/slices/seller-slice";
import { SellerUpdateDto } from "@/models/dtos/seller-update.dto";

export const SellerDetailsForm = () => {
  const dispatch = useAppDispatch();

  const seller = useAppSelector(selectSeller);
  const error = useAppSelector(selectSellerLoading);
  const saveInProgress = useAppSelector(selectSellerSaveInProgress);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SellerUpdateDto>({
    defaultValues: {
      name: seller?.name ?? "",
      type: seller?.type ?? "business",
      domains: seller?.domains ?? [],
      logoUrl: seller?.logoUrl ?? "",
      contactEmail: seller?.contactEmail ?? "",
      contactPhone: seller?.contactPhone ?? "",
      location: seller?.location ?? "",
      verified: seller?.verified ?? false,
      active: seller?.active ?? true,
      maxConcurrent: seller?.maxConcurrent ?? null,
      requestsPerHour: seller?.requestsPerHour ?? null,
    },
  });

  useEffect(() => {
    if (seller) {
      reset({
        name: seller.name ?? "",
        type: seller.type ?? "business",
        domains: seller.domains ?? [],
        logoUrl: seller.logoUrl ?? "",
        contactEmail: seller.contactEmail ?? "",
        contactPhone: seller.contactPhone ?? "",
        location: seller.location ?? "",
        verified: seller.verified ?? false,
        active: seller.active ?? true,
        maxConcurrent: seller.maxConcurrent ?? null,
        requestsPerHour: seller.requestsPerHour ?? null,
      });
    }
  }, [seller, reset]);

  const onSubmit = async (values: SellerUpdateDto) => {
    if (!seller) return;

    await dispatch(
      updateSeller({
        id: seller.id.toString(),
        data: {
          ...values,
          logoUrl: values.logoUrl || undefined,
          contactEmail: values.contactEmail || undefined,
          contactPhone: values.contactPhone || undefined,
          location: values.location || undefined,
          maxConcurrent: values.maxConcurrent ?? null,
          requestsPerHour: values.requestsPerHour ?? null,
        },
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
          placeholder="Enter seller name"
          required
          {...register("name", { required: "Name is required" })}
          error={errors.name?.message}
        />

        <Controller
          name="type"
          control={control}
          rules={{ required: "Type is required" }}
          render={({ field, fieldState }) => (
            <Select
              label="Type"
              required
              data={[
                { value: "business", label: "business" },
                { value: "private", label: "private" },
              ]}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="domains"
          control={control}
          render={({ field }) => (
            <TagsInput
              label="Domains"
              description="Website domains associated with this seller"
              placeholder="Type and press Enter to add"
              value={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />

        <TextInput
          label="Logo URL"
          placeholder="https://..."
          {...register("logoUrl")}
          error={errors.logoUrl?.message}
        />

        <TextInput
          label="Contact email"
          placeholder="seller@example.com"
          {...register("contactEmail")}
          error={errors.contactEmail?.message}
        />

        <TextInput
          label="Contact phone"
          placeholder="+36..."
          {...register("contactPhone")}
          error={errors.contactPhone?.message}
        />

        <TextInput
          label="Location"
          placeholder="City, country"
          {...register("location")}
          error={errors.location?.message}
        />

        <Group grow>
          <Controller
            name="maxConcurrent"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Max Concurrent (combined)"
                description="Caps combined concurrent scrapes across all of this seller's product sources. Leave empty for no seller-level cap."
                placeholder="No cap"
                min={1}
                step={1}
                value={field.value ?? ""}
                onChange={(value) =>
                  field.onChange(value === "" ? null : Number(value))
                }
              />
            )}
          />

          <Controller
            name="requestsPerHour"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Requests Per Hour (combined)"
                description="Caps combined requests/hour across all of this seller's product sources. Leave empty for no seller-level cap."
                placeholder="No cap"
                min={1}
                step={1}
                value={field.value ?? ""}
                onChange={(value) =>
                  field.onChange(value === "" ? null : Number(value))
                }
              />
            )}
          />
        </Group>

        <Group>
          <Controller
            name="verified"
            control={control}
            render={({ field }) => (
              <Switch
                label="Verified"
                checked={field.value ?? false}
                onChange={(e) => field.onChange(e.currentTarget.checked)}
              />
            )}
          />

          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Switch
                label="Active"
                checked={field.value ?? true}
                onChange={(e) => field.onChange(e.currentTarget.checked)}
              />
            )}
          />
        </Group>

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
