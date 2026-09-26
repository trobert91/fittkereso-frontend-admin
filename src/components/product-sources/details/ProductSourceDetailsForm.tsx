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
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IoMdAlert } from "react-icons/io";
import dayjs from "dayjs";
import { isPlainObject, omit } from "lodash";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  selectProductSource,
  selectProductSourceError,
  selectProductSourceSaveInProgress,
  updateProductSource,
} from "@/store/slices/product-source-slice";
import { ProductSourceUpdateDto } from "@/models/dtos/product-source-update.dto";
import {
  isFeedSourceType,
  PRODUCT_SOURCE_TYPE_LABELS,
  ProductSourceConfig,
} from "@/models/product-source";
import { JsonEditor } from "@/components/JsonEditor";
import { getProductSourceConfigSchema } from "@/api-actions/product-source/get-product-source-config-schema";
import { CopyIdBadge } from "@/components/copy-id-badge";
import { DetailsSection } from "@/components/details/details-section";
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
  nextRunAt?: string | null;
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

  // The schema the backend validates against, fetched once so the editor can
  // flag an unknown operation or a misspelled parameter while it is being
  // typed rather than on the round trip to a rejected save.
  //
  // A failure here is deliberately silent: the editor still works without a
  // schema, and the save is validated server-side regardless, so a blocking
  // error would stop somebody editing a config over a check they are about to
  // get anyway.
  const [configSchema, setConfigSchema] = useState<
    Record<string, unknown> | undefined
  >(undefined);

  // Keyed on the source's type: the two types' configs share no keys, so the
  // wrong schema would reject every valid config rather than merely miss
  // mistakes.
  const sourceType = productSource?.type;

  useEffect(() => {
    if (!sourceType) return;
    let cancelled = false;

    getProductSourceConfigSchema(sourceType)
      .then((schema) => {
        if (!cancelled) setConfigSchema(schema);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [sourceType]);

  // maxItems is a config key, so its field edits the JSON text instead of
  // keeping a copy: the two can never disagree, and whichever was touched last
  // is what gets saved. Null while the text doesn't parse to an object.
  const parsedConfigJson = useMemo(() => {
    try {
      const value: unknown = JSON.parse(configJson);
      return isPlainObject(value) ? (value as ProductSourceConfig) : null;
    } catch {
      return null;
    }
  }, [configJson]);

  const maxItems = parsedConfigJson?.maxItems;

  const setMaxItems = (value: number | undefined) => {
    if (!parsedConfigJson) return;
    const next =
      value === undefined
        ? omit(parsedConfigJson, "maxItems")
        : { ...parsedConfigJson, maxItems: value };
    setConfigJson(JSON.stringify(next, null, 2));
    setConfigError(null);
  };

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
      identifiesProducts: productSource?.identifiesProducts ?? true,
      hasAllProducts: productSource?.hasAllProducts ?? false,
      maxConcurrent: productSource?.maxConcurrent ?? 1,
      requestsPerHour: productSource?.requestsPerHour ?? 1,
      frequency: productSource?.frequency ?? "",
      nextRunAt: isoToPicker(productSource?.nextRunAt),
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
        identifiesProducts: productSource.identifiesProducts ?? true,
        hasAllProducts: productSource.hasAllProducts ?? false,
        maxConcurrent: productSource.maxConcurrent ?? 1,
        requestsPerHour: productSource.requestsPerHour ?? 1,
        frequency: productSource.frequency ?? "",
        nextRunAt: isoToPicker(productSource.nextRunAt),
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
          frequency: values.frequency?.trim() || null,
          nextRunAt: pickerToIso(values.nextRunAt),
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
        {/* One field per row: descriptions and the seller select need the
            width, and a single column reads top to bottom like the save. */}
        <DetailsSection title="General">
          <TextInput
            label="Name"
            placeholder="Enter source name"
            required
            {...register("name", { required: "Name is required" })}
            error={errors.name?.message}
          />

          {/* Read-only on purpose, and the backend refuses a change anyway:
              the config format is bound to the type, so reinterpreting a
              stored config under a different one reads the wrong keys for
              everything. A shop that needs both gets a second source. */}
          <TextInput
            label="Type"
            description={
              sourceType
                ? `${PRODUCT_SOURCE_TYPE_LABELS[sourceType]}. Fixed at creation.`
                : "Fixed at creation."
            }
            value={sourceType ?? ""}
            disabled
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
        </DetailsSection>

        <DetailsSection
          title="Scheduling & processing"
          description="Scheduling gates the sync cron; processing gates whether the collector claims this source's queued tasks at all."
        >
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
            name="identifiesProducts"
            control={control}
            render={({ field }) => (
              <Switch
                label="Identifies products"
                description="Off: only adds prices, specs and descriptions to the seller's existing offers, matched by external id."
                checked={field.value ?? true}
                onChange={(event) => field.onChange(event.currentTarget.checked)}
              />
            )}
          />
          <Controller
            name="hasAllProducts"
            control={control}
            render={({ field }) => (
              <Switch
                label="Has all products"
                description="Feed sources only: a complete run removes the offers it did not see."
                disabled={!isFeedSourceType(sourceType)}
                checked={field.value ?? false}
                onChange={(event) => field.onChange(event.currentTarget.checked)}
              />
            )}
          />
        </DetailsSection>

        <DetailsSection
          title="Throttling"
          description="The seller's own caps apply on top of these — whichever is lower wins."
        >
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
        </DetailsSection>

        <DetailsSection
          title="Schedule"
          description="Runs happen overnight between 02:00 and 06:00. Clearing the next-run time makes the source due on the next tick in that window."
        >
          <TextInput
            label="Frequency"
            description="ms-compatible value, e.g. 6h or 1d"
            placeholder="6h"
            {...register("frequency")}
          />

          <Controller
            name="nextRunAt"
            control={control}
            render={({ field }) => (
              <DateTimePicker
                label="Next Run"
                placeholder="Due on next tick"
                withSeconds
                clearable
                value={field.value ?? null}
                onChange={field.onChange}
              />
            )}
          />

          <TextInput
            label="Last run"
            value={formatDate(productSource?.lastRunAt)}
            disabled
          />
        </DetailsSection>

        <DetailsSection
          title="Run size"
          description="Caps how many items one run imports, for small test runs. Leave it empty for full runs."
        >
          <NumberInput
            label="Max items per run"
            description={
              !parsedConfigJson
                ? "Fix the config JSON below to edit this."
                : isFeedSourceType(sourceType)
                  ? "Counts the feed rows a run queues or refreshes. Stored as maxItems in the config."
                  : "Counts items per list page, and only the first page of each listing is read. Stored as maxItems in the config."
            }
            placeholder="No cap"
            min={1}
            step={1}
            allowDecimal={false}
            allowNegative={false}
            disabled={!parsedConfigJson}
            value={typeof maxItems === "number" ? maxItems : ""}
            onChange={(value) =>
              setMaxItems(typeof value === "number" ? value : undefined)
            }
          />
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
            schema={configSchema as never}
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
