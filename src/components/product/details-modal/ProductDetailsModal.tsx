"use client";

import {
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { isNil } from "lodash";
import { ProductModel } from "@/models/product-model";
import { getProductById } from "@/api-actions/product/get-product";
import { ScoreRing } from "@/components/score-ring";
import { AdminSpecTable } from "../details/specs/AdminSpecTable";
import { OrderedSpec } from "@/models/product-specs";
import { routes } from "@/utils/routes";
import { ProductAliasesSection } from "./ProductAliasesSection";
import { ProductSourcesSection } from "./ProductSourcesSection";

export const ProductDetailsModal = ({
  productId,
  opened,
  onClose,
}: {
  productId?: string | null;
  opened: boolean;
  onClose: () => void;
}) => {
  const [product, setProduct] = useState<ProductModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !productId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProduct(null);
    getProductById(productId)
      .then((data) => {
        if (cancelled) return;
        if (!data) setError("Product not found");
        else setProduct(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
  const imageUrl =
    product.mainImage?.url ??
    product.images?.find((img) => !!img.url)?.url ??
    null;

  return (
    <Stack gap="lg">
      <Group align="center" wrap="nowrap" gap="lg">
        {imageUrl && (
          <Box style={{ flexShrink: 0 }}>
            <Image
              src={imageUrl}
              alt={product.displayName}
              w={220}
              h={220}
              fit="contain"
              radius="md"
            />
          </Box>
        )}
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

const SPECS_COLLAPSED_LIMIT = 7;

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
  const visible = expanded || !canCollapse
    ? specs
    : specs.slice(0, SPECS_COLLAPSED_LIMIT);
  return (
    <Stack gap="xs">
      <AdminSpecTable specs={visible} />
      {canCollapse && (
        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          onClick={() => setExpanded((v) => !v)}
          style={{ alignSelf: "flex-start" }}
        >
          {expanded
            ? "show less"
            : `show all ${specs.length} specs`}
        </Button>
      )}
    </Stack>
  );
};
