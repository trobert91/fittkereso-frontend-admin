"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Button,
  Modal,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IoIosAdd } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import {
  postCreateScrapeTask,
  ScrapeTaskCreateDto,
} from "@/api-actions/scrape-task/create-scrape-task";
import { getProductById } from "@/api-actions/product/get-product";
import { ScrapeQueueName } from "@/models/dtos/scrape-task-search-models";
import { selectProduct, setProduct } from "@/store/slices/product-slice";

interface CreateScrapeTaskFormValues {
  queue: ScrapeQueueName;
  productId: string;
  url: string;
  scheduledAt: string;
}

interface CreateScrapeTaskActionProps {
  onCreated?: () => void;
}

export function CreateScrapeTaskAction({
  onCreated,
}: CreateScrapeTaskActionProps) {
  const dispatch = useDispatch();
  const currentProduct = useSelector(selectProduct);
  const [opened, setOpened] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateScrapeTaskFormValues>({
    defaultValues: {
      queue: ScrapeQueueName.ScrapeProductDetails,
      productId: "",
      url: "",
      scheduledAt: "",
    },
  });

  const onSubmit = async (values: CreateScrapeTaskFormValues) => {
    try {
      const dto: ScrapeTaskCreateDto = {
        queue: values.queue,
        url: values.url,
      };

      if (values.productId) {
        dto.productId = values.productId;
      }

      if (values.scheduledAt) {
        dto.scheduledAt = new Date(values.scheduledAt).toISOString();
      }

      await postCreateScrapeTask(dto);

      if (currentProduct && values.productId === currentProduct.id) {
        const refreshed = await getProductById(currentProduct.id);
        dispatch(setProduct(refreshed));
      }

      notifications.show({
        title: "Success",
        message: "Scrape task created successfully",
        color: "green",
      });

      handleClose();
      onCreated?.();
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Scrape task creation failed",
        color: "red",
      });
    }
  };

  const handleClose = () => {
    setOpened(false);
    reset();
  };

  const queueOptions = Object.values(ScrapeQueueName).map((queue) => ({
    value: queue,
    label: queue,
  }));

  return (
    <>
      <Button
        leftSection={<IoIosAdd size={14} />}
        variant="filled"
        onClick={() => setOpened(true)}
      >
        Add scrape task
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Add new scrape task"
        centered
        size="lg"
      >
        <form>
          <Stack gap="md">
            <Controller
              name="queue"
              control={control}
              rules={{ required: "Queue is required" }}
              render={({ field }) => (
                <Select
                  label="Queue"
                  placeholder="Select queue"
                  data={queueOptions}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  error={errors.queue?.message}
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
