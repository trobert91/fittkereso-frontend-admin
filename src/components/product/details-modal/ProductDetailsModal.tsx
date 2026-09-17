"use client";

import {
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  CopyButton,
  Group,
  Image,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { isNil } from "lodash";
import { ProductModel } from "@/models/product-model";
import { getProductById } from "@/api-actions/product/get-product";
import { ScoreRing } from "@/components/score-ring";
import { ProductOffersList } from "../details/offers/ProductOffersList";
import { OrderedSpec } from "@/models/product-specs";
import { routes } from "@/utils/routes";
import { productImageUrl } from "@/utils/product-image";
import { ProductAliasesSection } from "./ProductAliasesSection";
import { ProductSourcesSection } from "./ProductSourcesSection";

export const ProductDetailsModal = ({
  productId,
  opened,
  onClose,
  zIndex,
}: {
  productId?: string | null;
  opened: boolean;
  onClose: () => void;
  /** Raise it above another modal when this one is opened from inside one. */
  zIndex?: number;
}) => {
  // Both results carry the id they belong to, so the render can tell a loaded
  // product from a stale one. Opening a second product therefore shows the
  // loader rather than a flash of the first, and nothing has to be reset when
  // `productId` changes — which is also what keeps this effect free of the
  // synchronous setState the react-hooks rule rejects.
  const [loaded, setLoaded] = useState<{
    id: string;
    product: ProductModel;
  } | null>(null);
  const [failed, setFailed] = useState<{ id: string; message: string } | null>(
    null,
  );

  // Compared through the object, not `loaded?.id`: `productId` is optional, so
  // an absent id would otherwise match an absent result.
  const product = loaded && loaded.id === productId ? loaded.product : null;
  const error = failed && failed.id === productId ? failed.message : null;
  const loading = !!productId && !product && !error;

  useEffect(() => {
    if (!opened || !productId) return;
    let cancelled = false;
    getProductById(productId)
      .then((data) => {
        if (cancelled) return;
        if (!data) setFailed({ id: productId, message: "Product not found" });
        else setLoaded({ id: productId, product: data });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setFailed({
          id: productId,
          message: e instanceof Error ? e.message : "Failed to load product",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [opened, productId]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="90%"
      centered
      zIndex={zIndex}
    >
      {loading || !productId ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : error ? (
        <Text c="red">{error}</Text>
      ) : product ? (
        <ProductDetailsModalContent product={product} />
      ) : null}
    </Modal>
  );
};

const ProductDetailsModalContent = ({ product }: { product: ProductModel }) => {
  const rating = product.rating;
  const hasRating = !isNil(rating?.rating);
  const imageUrl = productImageUrl(product);

  return (
    <Stack gap="lg">
      <Group align="center" wrap="nowrap" gap="lg">
        <Box style={{ flexShrink: 0 }} w={220} h={220}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.displayName}
              w={220}
              h={220}
              fit="contain"
              radius="md"
            />
          ) : (
            <Center h="100%">
              <Text size="sm" c="dimmed">
                No image
              </Text>
            </Center>
          )}
        </Box>
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group gap="xs">
            {product.brand?.name && (
              <Badge variant="light" size="sm">
                {product.brand.name}
              </Badge>
            )}
            {product.productCategory?.name && (
              <Badge variant="light" size="sm" color="gray">
                {product.productCategory.name}
              </Badge>
            )}
            {product.releaseYear && (
              <Badge variant="light" size="sm">
                {product.releaseYear}
              </Badge>
            )}
            {/* Click-to-copy, because the reason to surface an id at all is to
                take it somewhere else — the product-id filter, a log query, a
                ticket. Monospaced so a uuid can be eyeballed against one. */}
            <CopyButton value={product.id}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? "Copied" : "Copy product ID"}
                  withArrow
                >
                  <Badge
                    variant="outline"
                    size="sm"
                    color={copied ? "green" : "gray"}
                    tt="none"
                    ff="monospace"
                    style={{ cursor: "pointer" }}
                    onClick={copy}
                  >
                    {product.id}
                  </Badge>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          <Title order={3}>{product.displayName}</Title>
          <Text c="dimmed" size="sm">
            model: {product.model}
          </Text>
          <ProductAliasesSection aliases={product.aliases} />
          <Anchor
            component={Link}
            href={routes.products.details(product.id)}
            target="_blank"
            size="sm"
          >
            open full product page
          </Anchor>
        </Stack>
        {hasRating && (
          <Box style={{ flexShrink: 0 }}>
            <ScoreRing
              rate={rating!.rating!}
              reviewCount={rating!.totalReviewCount}
              size={96}
              thickness={8}
              showLabel
            />
          </Box>
        )}
      </Group>

      <Section title="Specifications">
        <SpecsBlock specs={product.orderedSpecs ?? []} />
      </Section>

      <Section title="Offers">
        <ProductOffersList offers={product.offers} />
      </Section>

      <Section title="Sources">
        <ProductSourcesSection sources={product.sources} />
      </Section>
    </Stack>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Stack gap="xs">
    <Title order={5}>{title}</Title>
    {children}
  </Stack>
);

const SPECS_COLLAPSED_LIMIT = 12;

function formatSpecValue(value: OrderedSpec["value"]): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/**
 * One label/value row per spec. A bike carries thirty-odd of these, so the
 * tiles this used to draw turned the section into a wall — a plain table reads
 * down the labels in one pass, which is how you actually compare two products.
 * Split across two columns because the modal is wide enough to halve the
 * scrolling.
 */
const SpecsBlock = ({ specs }: { specs: OrderedSpec[] }) => {
  const [expanded, setExpanded] = useState(false);
  if (specs.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No specifications.
      </Text>
    );
  }

  const canCollapse = specs.length > SPECS_COLLAPSED_LIMIT;
  const visible =
    expanded || !canCollapse ? specs : specs.slice(0, SPECS_COLLAPSED_LIMIT);
  const half = Math.ceil(visible.length / 2);
  const columns = [visible.slice(0, half), visible.slice(half)];

  return (
    <Stack gap="xs">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" verticalSpacing={0}>
        {columns.map((column, index) =>
          column.length === 0 ? null : (
            <Table key={index} withRowBorders verticalSpacing={5} fz="sm">
              <Table.Tbody>
                {column.map((spec) => (
                  <Table.Tr key={spec.key}>
                    <Table.Td w="45%">
                      <Text size="sm" c="dimmed">
                        {spec.label}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatSpecValue(spec.value)}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ),
        )}
      </SimpleGrid>
      {canCollapse && (
        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          onClick={() => setExpanded((v) => !v)}
          style={{ alignSelf: "flex-start" }}
        >
          {expanded ? "show less" : `show all ${specs.length} specs`}
        </Button>
      )}
    </Stack>
  );
};
