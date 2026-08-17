"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Grid,
  GridCol,
  Group,
  Loader,
  Center,
  Modal,
  Portal,
  Stack,
  Text,
  Card,
  Anchor,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Image from "next/image";
import Link from "next/link";
import { isArray, sortBy } from "lodash";
import {
  getDuplicatePairById,
  postApproveDuplicatePair,
  postRejectDuplicatePair,
  SpecMatchDetails,
  SpecMatchResult,
} from "@/api-actions/product/product-duplicates";
import { ProductModel } from "@/models/product-model";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";

export interface DuplicatePairConfirmAction {
  id: string;
  type: "approve" | "reject";
}

interface DuplicatePairConfirmModalProps {
  action: DuplicatePairConfirmAction | null;
  onClose: () => void;
  onComplete: () => void;
}

function formatSpecValue(
  value: string | number | boolean | string[] | undefined,
): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (isArray(value)) return value.join(", ");
  return String(value);
}

type SpecMatchMap = Record<string, SpecMatchResult>;

function ProductColumn({
  product,
  specMatchMap,
}: {
  product: ProductModel;
  specMatchMap: SpecMatchMap;
}) {
  const mainImage =
    product.mainImage?.url ??
    sortBy(product.images ?? [], "order")[0]?.url;

  return (
    <Stack gap="sm">
      <Card p="xs" radius="md" withBorder h={180}>
        <Center h="100%">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.displayName}
              style={{ objectFit: "contain", borderRadius: 6 }}
              height={160}
              width={280}
            />
          ) : (
            <Text size="sm" c="dimmed">No image</Text>
          )}
        </Center>
      </Card>

      <Stack gap={4} h={90} justify="flex-start">
        <Group gap="xs">
          <Text size="sm" fw={600}>
            {product.displayName}
          </Text>
          <Anchor component={Link} href={routes.products.details(product.id)}>
            <LuExternalLink size={12} />
          </Anchor>
        </Group>

        <Text size="sm" c="blue">
          {product.brand?.name ?? "—"}
        </Text>

        <Text size="xs" c="dimmed">
          Model: {product.model}
        </Text>

        {product.releaseYear && (
          <Badge variant="light" size="sm" w="fit-content">
            {product.releaseYear}
          </Badge>
        )}
      </Stack>

      {product.orderedSpecs && product.orderedSpecs.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" fw={600} mt="xs">
            Specs
          </Text>
          {[...product.orderedSpecs].sort((a, b) => a.label.localeCompare(b.label)).map((spec) => {
            const matchResult = specMatchMap[spec.key];
            const bgColor =
              matchResult === "match"
                ? "var(--mantine-color-green-light)"
                : matchResult === "compatible"
                  ? "var(--mantine-color-yellow-light)"
                  : matchResult === "mismatch"
                    ? "var(--mantine-color-red-light)"
                    : undefined;

            return (
              <Group
                key={spec.key}
                gap={4}
                wrap="nowrap"
                style={{
                  backgroundColor: bgColor,
                  borderRadius: 4,
                  padding: "2px 6px",
                }}
              >
                <Text size="xs" c="dimmed" style={{ minWidth: 100 }}>
                  {spec.label}
                </Text>
                <Text size="xs">{formatSpecValue(spec.value)}</Text>
              </Group>
            );
          })}
        </Stack>
      )}

      {product.sources && product.sources.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" fw={600} mt="xs">
            Sources
          </Text>
          {product.sources.map((source) => (
            <Group key={source.id} gap={4}>
              <Badge size="xs" variant="light">
                {source.source?.name ?? "Manual"}
              </Badge>
              {source.url && (
                <Anchor href={source.url} target="_blank" size="xs" truncate>
                  {source.url}
                </Anchor>
              )}
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function DuplicatePairConfirmModal({
  action,
  onClose,
  onComplete,
}: DuplicatePairConfirmModalProps) {
  const [productA, setProductA] = useState<ProductModel | null>(null);
  const [productB, setProductB] = useState<ProductModel | null>(null);
  const [specMatchMap, setSpecMatchMap] = useState<SpecMatchMap>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!action) {
      setProductA(null);
      setProductB(null);
      setSpecMatchMap({});
      return;
    }

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const pair = await getDuplicatePairById(action.id);

        const matchMap: SpecMatchMap = {};
        for (const detail of pair.specMatchDetails?.details ?? []) {
          matchMap[detail.key] = detail.match;
        }
        setSpecMatchMap(matchMap);
        setProductA(pair.productA);
        setProductB(pair.productB);
      } catch (err) {
        console.error("Failed to fetch duplicate pair details:", err);
        notifications.show({
          color: "red",
          title: "Failed to load details",
          message:
            err instanceof Error ? err.message : "An error occurred",
        });
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [action]);

  const handleConfirm = async () => {
    if (!action) return;
    setConfirmLoading(true);
    try {
      if (action.type === "approve") {
        await postApproveDuplicatePair(action.id);
        notifications.show({
          color: "green",
          title: "Pair approved",
          message: "Products have been merged",
        });
      } else {
        await postRejectDuplicatePair(action.id);
        notifications.show({
          color: "blue",
          title: "Pair rejected",
          message: "Marked as not duplicates",
        });
      }
      onClose();
      onComplete();
    } catch (err) {
      notifications.show({
        color: "red",
        title: `${action.type === "approve" ? "Approve" : "Reject"} failed`,
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Portal reuseTargetNode={false}>
      <Modal
        opened={!!action}
        onClose={() => !confirmLoading && onClose()}
        title={
          action?.type === "approve"
            ? "Approve & merge duplicate pair"
            : "Reject duplicate pair"
        }
        centered
        size="xl"
      >
        {detailsLoading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!detailsLoading && productA && productB && (
          <Stack gap="md">
            <Grid gutter="lg">
              <GridCol span={6}>
                <ProductColumn product={productA} specMatchMap={specMatchMap} />
              </GridCol>
              <GridCol span={6}>
                <ProductColumn product={productB} specMatchMap={specMatchMap} />
              </GridCol>
            </Grid>

            <Text size="sm" c="dimmed" mt="sm">
              {action?.type === "approve"
                ? "Approving will merge these products into one. This action cannot be undone."
                : "Rejecting will mark this pair as not duplicates. It will not be flagged again."}
            </Text>

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={onClose}
                disabled={confirmLoading}
              >
                Cancel
              </Button>
              <Button
                color={action?.type === "approve" ? "green" : "red"}
                loading={confirmLoading}
                onClick={handleConfirm}
              >
                {action?.type === "approve" ? "Approve & merge" : "Reject"}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Portal>
  );
}
