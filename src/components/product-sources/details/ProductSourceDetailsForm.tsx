"use client";

import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Group,
  NumberInput,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  selectProductSource,
  selectProductSourceError,
  selectProductSourceSaveInProgress,
  updateProductSource,
} from "@/store/slices/product-source-slice";
import { ProductSourceUpdateDto } from "@/models/dtos/product-source-update.dto";

const formatDate = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

export function ProductSourceDetailsForm() {
  const dispatch = useAppDispatch();
  const productSource = useAppSelector(selectProductSource);
  const error = useAppSelector(selectProductSourceError);
  const saveInProgress = useAppSelector(selectProductSourceSaveInProgress);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductSourceUpdateDto>({
    defaultValues: {
      name: productSource?.name ?? "",
      schedulingEnabled: productSource?.schedulingEnabled ?? false,
      processingEnabled: productSource?.processingEnabled ?? false,
      priority: productSource?.priority ?? 0,
      maxConcurrent: productSource?.maxConcurrent ?? 1,
      requestsPerHour: productSource?.requestsPerHour ?? 1,
      fullSyncInterval: productSource?.fullSyncInterval ?? "",
      incrementalSyncInterval: productSource?.incrementalSyncInterval ?? "",
    },
  });

  useEffect(() => {
    if (productSource) {
      reset({
        name: productSource.name ?? "",
        schedulingEnabled: productSource.schedulingEnabled ?? false,
        processingEnabled: productSource.processingEnabled ?? false,
        priority: productSource.priority ?? 0,
        maxConcurrent: productSource.maxConcurrent ?? 1,
        requestsPerHour: productSource.requestsPerHour ?? 1,
        fullSyncInterval: productSource.fullSyncInterval ?? "",
        incrementalSyncInterval: productSource.incrementalSyncInterval ?? "",
      });
    }
  }, [productSource, reset]);

  useEffect(() => {
    if (error) {
      notifications.show({
        title: "Error",
        message: error,
        color: "red",
      });
    }
  }, [error]);

  const onSubmit = async (values: ProductSourceUpdateDto) => {
    if (!productSource) {
      return;
    }

    await dispatch(
      updateProductSource({
        id: productSource.id,
        data: {
          ...values,
          fullSyncInterval: values.fullSyncInterval?.trim() || null,
          incrementalSyncInterval:
            values.incrementalSyncInterval?.trim() || null,
        },
      }),
    );

    notifications.show({
      title: "Saved",
      message: "Product source updated",
      color: "green",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack mx="auto" gap="md" maw={1000}>
        <TextInput
          label="Name"
          placeholder="Enter source name"
          {...register("name")}
          error={errors.name?.message}
        />

        <Group gap="xl">
          <Controller
            name="schedulingEnabled"
            control={control}
            render={({ field }) => (
              <Switch
                label="Scheduling Enabled"
                checked={field.value ?? false}
                onChange={(event) =>
                  field.onChange(event.currentTarget.checked)
                }
              />
            )}
          />

          <Controller
            name="processingEnabled"
            control={control}
            render={({ field }) => (
              <Switch
                label="Processing Enabled"
                checked={field.value ?? false}
                onChange={(event) =>
                  field.onChange(event.currentTarget.checked)
                }
              />
            )}
          />
        </Group>

        <Group grow>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Priority"
                min={0}
                step={1}
                value={field.value ?? 0}
                onChange={(value) => field.onChange(Number(value) || 0)}
              />
            )}
          />

          <Controller
            name="maxConcurrent"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Max Concurrent"
                min={1}
                step={1}
                value={field.value ?? 1}
                onChange={(value) => field.onChange(Number(value) || 1)}
              />
            )}
          />

          <Controller
            name="requestsPerHour"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Requests Per Hour"
                min={1}
                step={1}
                value={field.value ?? 1}
                onChange={(value) => field.onChange(Number(value) || 1)}
              />
            )}
          />
        </Group>

        <TextInput
          label="Full Sync Interval"
          description="ms-compatible value, e.g. 6h or 1d"
          placeholder="6h"
          {...register("fullSyncInterval")}
        />

        <TextInput
          label="Incremental Sync Interval"
          description="ms-compatible value, e.g. 30m or 2h"
          placeholder="30m"
          {...register("incrementalSyncInterval")}
        />

        <Group grow>
          <TextInput label="ID" value={productSource?.id ?? ""} disabled />
          <TextInput label="Type" value={productSource?.type ?? ""} disabled />
          <TextInput
            label="Last Run"
            value={formatDate(productSource?.lastRunAt)}
            disabled
          />
        </Group>

        <Group grow>
          <TextInput
            label="Last Full Sync"
            value={formatDate(productSource?.lastFullSyncAt)}
            disabled
          />
          <TextInput
            label="Next Full Sync"
            value={formatDate(productSource?.nextFullSyncAt)}
            disabled
          />
        </Group>

        <Group grow>
          <TextInput
            label="Last Incremental Sync"
            value={formatDate(productSource?.lastIncrementalSyncAt)}
            disabled
          />
          <TextInput
            label="Next Incremental Sync"
            value={formatDate(productSource?.nextIncrementalSyncAt)}
            disabled
          />
        </Group>

        <Group grow>
          <TextInput
            label="Created"
            value={formatDate(productSource?.createdAt)}
            disabled
          />
          <TextInput
            label="Updated"
            value={formatDate(productSource?.updatedAt)}
            disabled
          />
        </Group>

        <Button
          loading={isSubmitting || saveInProgress}
          type="submit"
          fullWidth
        >
          Save
        </Button>
      </Stack>
    </form>
  );
}
