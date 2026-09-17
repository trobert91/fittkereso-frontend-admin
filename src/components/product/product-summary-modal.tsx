"use client";

import { useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  Card,
  Center,
  Code,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { isArray, sortBy } from "lodash";
import Link from "next/link";
import { FiExternalLink } from "react-icons/fi";
import { getProductById } from "@/api-actions/product/get-product";
import { ProductModel } from "@/models/product-model";
import { routes } from "@/utils/routes";

/** Above Mantine's default modal z-index, so this opens on top of a modal. */
const STACKED_Z_INDEX = 400;

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (isArray(value)) return value.join(", ");
  return String(value);
}

/**
 * A product at a glance, without leaving the page you were on. Deliberately not
 * the full details view: enough to decide whether two rows are the same bike,
 * with a link out when they aren't enough.
 *
 * Always fetched by id rather than handed a product, so it shows the same thing
 * wherever it is opened from — a list row carries a thinner product than the
 * details endpoint returns.
 */
export function ProductSummaryModal({
  productId,
  onClose,
}: {
  productId: string | null;
  onClose: () => void;
}) {
  // Both results carry the id they belong to, so opening a second product
  // shows a loader rather than a flash of the first one — and nothing has to be
  // reset when `productId` changes.
  const [loaded, setLoaded] = useState<{
    id: string;
    product: ProductModel;
  } | null>(null);
  const [failed, setFailed] = useState<{ id: string; message: string } | null>(
    null,
  );

  const product = loaded?.id === productId ? loaded.product : null;
  const error = failed?.id === productId ? failed.message : null;
  const loading = !!productId && !product && !error;

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    getProductById(productId)
      .then((result) => {
        if (cancelled) return;
        if (!result) throw new Error("This product no longer exists");
        setLoaded({ id: productId, product: result });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFailed({
          id: productId,
          message: err instanceof Error ? err.message : "Failed to load",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const imageUrl =
    product?.mainImage?.url ?? sortBy(product?.images ?? [], "order")[0]?.url;

  return (
    <Modal
      opened={!!productId}
      onClose={onClose}
      title={product?.displayName ?? "Product"}
      centered
      size={640}
      zIndex={STACKED_Z_INDEX}
    >
      {loading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {!loading && error && (
        <Text size="sm" c="red">
          {error}
        </Text>
      )}

      {!loading && product && (
        <Stack gap="md">
          <Group align="flex-start" wrap="nowrap" gap="md">
            <Card p="xs" radius="md" withBorder w={160} h={160}>
              <Center h="100%">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.displayName}
                    h={140}
                    fit="contain"
                  />
                ) : (
                  <Text size="xs" c="dimmed">
                    No image
                  </Text>
                )}
              </Center>
            </Card>

            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={600}>
                {product.displayName}
              </Text>
              <Text size="sm" c="blue">
                {product.brand?.name ?? "—"}
                {product.productCategory?.name
                  ? ` · ${product.productCategory.name}`
                  : ""}
              </Text>
              <Text size="xs" c="dimmed">
                Model: {formatValue(product.model)}
              </Text>
              <Group gap={6} wrap="nowrap">
                <Text size="xs" c="dimmed">
                  Name key:
                </Text>
                <Code fz="xs">{product.normalizedName ?? "—"}</Code>
              </Group>
              <Group gap="xs" mt={4}>
                <Badge variant="light" size="sm">
                  {product.sources?.length ?? 0} listings
                </Badge>
                <Badge variant="light" size="sm">
                  {product.offers?.length ?? 0} offers
                </Badge>
                {product.price != null && (
                  <Badge variant="light" size="sm" color="green">
                    {product.price.toLocaleString("hu-HU")} Ft
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>

          {(product.orderedSpecs ?? []).length > 0 ? (
            <Table withTableBorder verticalSpacing={4} fz="xs">
              <Table.Tbody>
                {(product.orderedSpecs ?? []).map((spec) => (
                  <Table.Tr key={spec.key}>
                    <Table.Td style={{ width: 160 }}>
                      <Text size="xs" c="dimmed">
                        {spec.label}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{formatValue(spec.value)}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text size="xs" c="dimmed">
              No specs on this product.
            </Text>
          )}

          <Group justify="flex-end">
            <Anchor
              component={Link}
              href={routes.products.details(product.id)}
              target="_blank"
              size="sm"
            >
              <Group gap={4} wrap="nowrap">
                Open full page
                <FiExternalLink size={13} />
              </Group>
            </Anchor>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
