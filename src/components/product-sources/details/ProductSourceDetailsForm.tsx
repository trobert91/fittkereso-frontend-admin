"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Button,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IoMdAlert } from "react-icons/io";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  selectProductSource,
  selectProductSourceError,
  selectProductSourceSaveInProgress,
  updateProductSource,
} from "@/store/slices/product-source-slice";
import { ProductSourceUpdateDto } from "@/models/dtos/product-source-update.dto";
import { ProductSourceConfig } from "@/models/product-source";
import { JsonEditor } from "@/components/JsonEditor";
import { CopyIdBadge } from "@/components/copy-id-badge";
import { DetailsSection } from "./DetailsSection";
import { useSellerSearch } from "@/hooks/useSellerSearch";
import { formatDate } from "@/utils/date";

// DateTimePicker hands back (and happily accepts) dayjs' "YYYY-MM-DD HH:mm:ss"
// local-time strings, while the API speaks ISO — these two keep the boundary
// in one place rather than sprinkling dayjs calls through the form.
const PICKER_FORMAT = "YYYY-MM-DD HH:mm:ss";

function isoToPicker(value?: string | null): string | null {
  return value ? dayjs(value).format(PICKER_FORMAT) : null;
}

function pickerToIso(value?: string | null): string | null {
  return value ? dayjs(value).toISOString() : null;
}

// Everything on the form except `config`, which the JSON editor owns — it has
// to keep unparseable intermediate text around while you type, which
// react-hook-form's typed value cannot hold.
interface FormValues extends Omit<ProductSourceUpdateDto, "config"> {
  nextFullSyncAt?: string | null;
  nextIncrementalSyncAt?: string | null;
}

export function ProductSourceDetailsForm({ onDone }: { onDone?: () => void }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const productSource = useAppSelector(selectProductSource);
  const error = useAppSelector(selectProductSourceError);
  const saveInProgress = useAppSelector(selectProductSourceSaveInProgress);

  const { search: searchSellers, searchResult: sellerSearchResult } =
    useSellerSearch();

  const [configJson, setConfigJson] = useState(
    JSON.stringify(productSource?.config ?? {}, null, 2),
  );
  const [configError, setConfigError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      name: productSource?.name ?? "",
      sellerId: productSource?.seller?.id ?? "",
      schedulingEnabled: productSource?.schedulingEnabled ?? false,
      processingEnabled: productSource?.processingEnabled ?? false,
      priority: productSource?.priority ?? 0,
      maxConcurrent: productSource?.maxConcurrent ?? 1,
      requestsPerHour: productSource?.requestsPerHour ?? 1,
      fullSyncInterval: productSource?.fullSyncInterval ?? "",
      incrementalSyncInterval: productSource?.incrementalSyncInterval ?? "",
      nextFullSyncAt: isoToPicker(productSource?.nextFullSyncAt),
      nextIncrementalSyncAt: isoToPicker(productSource?.nextIncrementalSyncAt),
    },
  });

  useEffect(() => {
    searchSellers({ pageSize: 200, sort: "name", order: "ASC" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (productSource) {
      reset({
        name: productSource.name ?? "",
        sellerId: productSource.seller?.id ?? "",
        schedulingEnabled: productSource.schedulingEnabled ?? false,
        processingEnabled: productSource.processingEnabled ?? false,
        priority: productSource.priority ?? 0,
        maxConcurrent: productSource.maxConcurrent ?? 1,
        requestsPerHour: productSource.requestsPerHour ?? 1,
        fullSyncInterval: productSource.fullSyncInterval ?? "",
        incrementalSyncInterval: productSource.incrementalSyncInterval ?? "",
        nextFullSyncAt: isoToPicker(productSource.nextFullSyncAt),
        nextIncrementalSyncAt: isoToPicker(productSource.nextIncrementalSyncAt),
      });
      setConfigJson(JSON.stringify(productSource.config ?? {}, null, 2));
      setConfigError(null);
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

  // The seller search is paged, so the source's own seller may not be in the
  // first page — fold it in so the select never renders a blank selection.
  const sellerOptions = useMemo(() => {
    const options = new Map<string, string>();

    if (productSource?.seller) {
      options.set(productSource.seller.id, productSource.seller.name);
    }

    for (const seller of sellerSearchResult?.items ?? []) {
      options.set(seller.id, seller.name);
    }

    return Array.from(options, ([value, label]) => ({ value, label }));
  }, [productSource?.seller, sellerSearchResult]);

  const onSubmit = async (values: FormValues) => {
    if (!productSource) {
      return;
    }

    let parsedConfig: ProductSourceConfig;
    try {
      parsedConfig = JSON.parse(configJson) as ProductSourceConfig;
    } catch {
      setConfigError("Config must be valid JSON");
      return;
    }

    const result = await dispatch(
      updateProductSource({
        id: productSource.id,
        data: {
          ...values,
          // Omitted rather than sent empty: the API reads an absent sellerId as
          // "leave the seller alone", and an empty string would fail its UUID
          // check.
          sellerId: values.sellerId || undefined,
          config: parsedConfig,
          fullSyncInterval: values.fullSyncInterval?.trim() || null,
          incrementalSyncInterval:
            values.incrementalSyncInterval?.trim() || null,
          nextFullSyncAt: pickerToIso(values.nextFullSyncAt),
          nextIncrementalSyncAt: pickerToIso(values.nextIncrementalSyncAt),
        },
      }),
    );

    if (updateProductSource.rejected.match(result)) {
      return;
    }

    notifications.show({
      title: "Saved",
      message: "Product source updated",
      color: "green",
    });

    // The page title and breadcrumb are server-rendered from the source's name,
    // so a rename only lands once the server component re-runs.
    router.refresh();
    onDone?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="md">
        <DetailsSection title="General">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Name"
              placeholder="Enter source name"
              required
              {...register("name", { required: "Name is required" })}
              error={errors.name?.message}
            />

            <Controller
              name="sellerId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Seller"
                  description="Every offer this source produces is attributed to this seller."
                  placeholder="Select a seller"
                  data={sellerOptions}
                  searchable
                  value={field.value || null}
                  onChange={(value) => field.onChange(value ?? "")}
                />
              )}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Stack gap={2}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                ID
              </Text>
              <Group>
                <CopyIdBadge id={productSource?.id ?? ""} />
              </Group>
            </Stack>
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
          </SimpleGrid>
        </DetailsSection>

        <DetailsSection
          title="Scheduling & processing"
          description="Scheduling gates the sync cron; processing gates whether the collector claims this source's queued tasks at all."
        >
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

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
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

            <TextInput
              label="Last run"
              value={formatDate(productSource?.lastRunAt)}
              disabled
            />
          </SimpleGrid>
        </DetailsSection>

        <DetailsSection
          title="Throttling"
          description="The seller's own caps apply on top of these — whichever is lower wins."
        >
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
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
          </SimpleGrid>
        </DetailsSection>

        <DetailsSection
          title="Full sync"
          description="Clearing the next-sync time makes the sync due on the collector's next tick."
        >
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <TextInput
              label="Full Sync Interval"
              description="ms-compatible value, e.g. 6h or 1d"
              placeholder="6h"
              {...register("fullSyncInterval")}
            />

            <Controller
              name="nextFullSyncAt"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  label="Next Full Sync"
                  placeholder="Due on next tick"
                  withSeconds
                  clearable
                  value={field.value ?? null}
                  onChange={field.onChange}
                />
              )}
            />

            <TextInput
              label="Last full sync"
              value={formatDate(productSource?.lastFullSyncAt)}
              disabled
            />
          </SimpleGrid>
        </DetailsSection>

        <DetailsSection title="Incremental sync">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <TextInput
              label="Incremental Sync Interval"
              description="ms-compatible value, e.g. 30m or 2h"
              placeholder="30m"
              {...register("incrementalSyncInterval")}
            />

            <Controller
              name="nextIncrementalSyncAt"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  label="Next Incremental Sync"
                  placeholder="Due on next tick"
                  withSeconds
                  clearable
                  value={field.value ?? null}
                  onChange={field.onChange}
                />
              )}
            />

            <TextInput
              label="Last incremental sync"
              value={formatDate(productSource?.lastIncrementalSyncAt)}
              disabled
            />
          </SimpleGrid>
        </DetailsSection>

        <DetailsSection
          title="Config"
          description="Replaces the stored config in full — edit the whole object, not a fragment."
        >
          <JsonEditor
            label="Raw config"
            value={configJson}
            onChange={(value) => {
              setConfigJson(value);
              setConfigError(null);
            }}
            schema={undefined}
            minHeight={300}
            maxHeight={500}
          />
          {configError && (
            <Alert variant="light" color="red" icon={<IoMdAlert />}>
              {configError}
            </Alert>
          )}
        </DetailsSection>

        <Group justify="flex-end">
          {onDone && (
            <Button variant="default" onClick={onDone}>
              Cancel
            </Button>
          )}
          <Button loading={isSubmitting || saveInProgress} type="submit">
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
