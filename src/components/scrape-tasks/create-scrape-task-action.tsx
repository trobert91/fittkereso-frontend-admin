"use client";

import { useEffect, useState } from "react";
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
import { postProductSourceSearch } from "@/api-actions/product-source/product-source-search";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import { selectProduct, setProduct } from "@/store/slices/product-slice";

interface CreateScrapeTaskFormValues {
  queue: ScrapeQueueName;
  sourceId: string;
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
  const [productSources, setProductSources] = useState<ProductSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateScrapeTaskFormValues>({
    defaultValues: {
      queue: ScrapeQueueName.ScrapeProductDetails,
      sourceId: "",
      productId: "",
      url: "",
      scheduledAt: "",
    },
  });

  useEffect(() => {
    if (!opened) return;

    const loadSources = async () => {
      setSourcesLoading(true);
      try {
        const result = await postProductSourceSearch({
          pageSize: 100,
          sort: "name",
          order: "ASC",
        });
        setProductSources(result.items ?? []);
      } catch {
        notifications.show({
          title: "Error",
          message: "Failed to load product sources",
          color: "red",
        });
      } finally {
        setSourcesLoading(false);
      }
    };

    loadSources();
  }, [opened]);

  const onSubmit = async (values: CreateScrapeTaskFormValues) => {
    try {
      const dto: ScrapeTaskCreateDto = {
        queue: values.queue,
        sourceId: values.sourceId,
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

  const sourceOptions = productSources.map((source) => ({
    value: source.id,
    label: `${source.name} (${source.type})`,
  }));

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

            <Controller
              name="sourceId"
              control={control}
              rules={{ required: "Source is required" }}
              render={({ field }) => (
                <Select
                  label="Source"
                  placeholder="Select product source"
                  data={sourceOptions}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  error={errors.sourceId?.message}
                  searchable
                  required
                  disabled={sourcesLoading}
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
