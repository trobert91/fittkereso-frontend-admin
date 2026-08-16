"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { IoMdAlert } from "react-icons/io";
import { notifications } from "@mantine/notifications";
import { putProductSourceUpdate } from "@/api-actions/product-source/product-source-update";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import { ProductSourceUpdateDto } from "@/models/dtos/product-source-update.dto";
import { JsonEditor } from "@/components/JsonEditor";

interface EditProductSourceModalProps {
  productSource: ProductSource;
  opened: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

type FormValues = Omit<ProductSourceUpdateDto, "config">;

export function EditProductSourceModal({
  productSource,
  opened,
  onClose,
  onUpdated,
}: EditProductSourceModalProps) {
  const [configJson, setConfigJson] = useState(
    JSON.stringify(productSource.config ?? {}, null, 2)
  );
  const [configError, setConfigError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: productSource.name,
      schedulingEnabled: productSource.schedulingEnabled,
      processingEnabled: productSource.processingEnabled,
      priority: productSource.priority,
      maxConcurrent: productSource.maxConcurrent,
      requestsPerHour: productSource.requestsPerHour,
      fullSyncInterval: productSource.fullSyncInterval ?? "",
      incrementalSyncInterval: productSource.incrementalSyncInterval ?? "",
    },
  });

  useEffect(() => {
    if (opened) {
      reset({
        name: productSource.name,
        schedulingEnabled: productSource.schedulingEnabled,
        processingEnabled: productSource.processingEnabled,
        priority: productSource.priority,
        maxConcurrent: productSource.maxConcurrent,
        requestsPerHour: productSource.requestsPerHour,
        fullSyncInterval: productSource.fullSyncInterval ?? "",
        incrementalSyncInterval: productSource.incrementalSyncInterval ?? "",
      });
      setConfigJson(JSON.stringify(productSource.config ?? {}, null, 2));
      setConfigError(null);
    }
  }, [opened, productSource, reset]);

  const onSubmit = async (values: FormValues) => {
    let parsedConfig: unknown;
    try {
      parsedConfig = JSON.parse(configJson);
    } catch {
      setConfigError("Config must be valid JSON");
      return;
    }

    setSaving(true);
    try {
      await putProductSourceUpdate(productSource.id, {
        ...values,
        config: parsedConfig,
        fullSyncInterval: values.fullSyncInterval?.trim() || null,
        incrementalSyncInterval: values.incrementalSyncInterval?.trim() || null,
      });

      notifications.show({
        title: "Success",
        message: "Product source updated",
        color: "green",
      });

      onUpdated();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update product source";
      notifications.show({ title: "Error", message, color: "red" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Edit product source — ${productSource.name}`}
      size="xl"
      centered
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Name"
            {...register("name", { required: "Name is required" })}
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
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
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
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
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

          <Group grow>
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
          </Group>

          <JsonEditor
            label="Config"
            value={configJson}
            onChange={(val) => {
              setConfigJson(val);
              setConfigError(null);
            }}
            schema={undefined}
            minHeight={300}
            maxHeight={400}
          />
          {configError && (
            <Alert variant="light" color="red" icon={<IoMdAlert />}>
              {configError}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
