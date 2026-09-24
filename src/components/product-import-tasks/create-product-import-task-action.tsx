"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Button,
  Modal,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IoIosAdd } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import {
  postCreateProductImportTask,
  ProductImportTaskCreateDto,
} from "@/api-actions/product-import-task/create-product-import-task";
import { getProductById } from "@/api-actions/product/get-product";
import {
  MANUAL_IMPORT_TASK_PRIORITY,
  MAX_IMPORT_TASK_PRIORITY,
  MIN_IMPORT_TASK_PRIORITY,
  ProductImportTaskKind,
} from "@/models/dtos/product-import-task-search-models";
import { selectProduct, setProduct } from "@/store/slices/product-slice";

interface CreateProductImportTaskFormValues {
  kind: ProductImportTaskKind;
  productId: string;
  url: string;
  scheduledAt: string;
  priority: number;
}

interface CreateProductImportTaskActionProps {
  onCreated?: () => void;
}

export function CreateProductImportTaskAction({
  onCreated,
}: CreateProductImportTaskActionProps) {
  const dispatch = useDispatch();
  const currentProduct = useSelector(selectProduct);
  const [opened, setOpened] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateProductImportTaskFormValues>({
    defaultValues: {
      kind: ProductImportTaskKind.DetailPage,
      productId: "",
      url: "",
      scheduledAt: "",
      priority: MANUAL_IMPORT_TASK_PRIORITY,
    },
  });

  const onSubmit = async (values: CreateProductImportTaskFormValues) => {
    try {
      const dto: ProductImportTaskCreateDto = {
        kind: values.kind,
        url: values.url,
        priority: values.priority,
      };

      if (values.productId) {
        dto.productId = values.productId;
      }

      if (values.scheduledAt) {
        dto.scheduledAt = new Date(values.scheduledAt).toISOString();
      }

      await postCreateProductImportTask(dto);

      if (currentProduct && values.productId === currentProduct.id) {
        const refreshed = await getProductById(currentProduct.id);
        dispatch(setProduct(refreshed));
      }

      notifications.show({
        title: "Success",
        message: "Import task created successfully",
        color: "green",
      });

      handleClose();
      onCreated?.();
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Import task creation failed",
        color: "red",
      });
    }
  };

  const handleClose = () => {
    setOpened(false);
    reset();
  };

  // A feed row's task is queued by its feed run; only page tasks are made by hand.
  const kindOptions = [
    ProductImportTaskKind.ListPage,
    ProductImportTaskKind.DetailPage,
  ].map((kind) => ({
    value: kind,
    label: kind,
  }));

  return (
    <>
      <Button
        leftSection={<IoIosAdd size={14} />}
        variant="filled"
        onClick={() => setOpened(true)}
      >
        Add import task
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Add new import task"
        centered
        size="lg"
      >
        <form>
          <Stack gap="md">
            <Controller
              name="kind"
              control={control}
              rules={{ required: "Kind is required" }}
              render={({ field }) => (
                <Select
                  label="Kind"
                  placeholder="Select kind"
                  data={kindOptions}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  error={errors.kind?.message}
                  required
                />
              )}
            />

            <TextInput
              label="URL"
              placeholder="https://..."
              {...register("url", { required: "URL is required" })}
              error={errors.url?.message}
              required
            />

            <TextInput
              label="Product ID"
              placeholder="Optional — UUID of the product"
              {...register("productId")}
              error={errors.productId?.message}
            />

            <TextInput
              label="Scheduled At"
              type="datetime-local"
              placeholder="Optional — leave empty for immediate processing"
              {...register("scheduledAt")}
              error={errors.scheduledAt?.message}
            />

            <Controller
              name="priority"
              control={control}
              rules={{
                min: { value: MIN_IMPORT_TASK_PRIORITY, message: "At least 0" },
                max: { value: MAX_IMPORT_TASK_PRIORITY, message: "At most 100" },
              }}
              render={({ field }) => (
                <NumberInput
                  label="Priority"
                  description="0–100, higher runs first. Import runs queue their own tasks at 50."
                  min={MIN_IMPORT_TASK_PRIORITY}
                  max={MAX_IMPORT_TASK_PRIORITY}
                  allowDecimal={false}
                  value={field.value}
                  onChange={(value) => field.onChange(Number(value))}
                  error={errors.priority?.message}
                />
              )}
            />

            <Button
              loading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              Create
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
