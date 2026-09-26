"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { IoMdAlert } from "react-icons/io";
import { FaArrowRight } from "react-icons/fa";
import { getProductSourceRecord } from "@/api-actions/product-source-record/product-source-record-actions";
import { ListingDetails } from "@/components/product/details/sources/ListingCard";
import { listingSpecRows } from "@/components/product/details/sources/listing-fields";
import {
  ProductSourceRecordDetails,
  ProductSourceRecordRow,
} from "@/models/dtos/product-source-record-models";
import { PRODUCT_SOURCE_TYPE_COLORS } from "@/models/product-source";
import { routes } from "@/utils/routes";

/**
 * The listing's own details, as the product page's Sources tab shows an open
 * listing, loaded when the modal opens. Keyed by the listing, so opening
 * another one starts from a blank state instead of the previous listing.
 */
function RecordDetailsBody({ recordId }: { recordId: string }) {
  const [details, setDetails] = useState<ProductSourceRecordDetails | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    getProductSourceRecord(recordId)
      .then((loaded) => {
        if (current) setDetails(loaded);
      })
      .catch((loadError: Error) => {
        if (current) setError(loadError.message);
      });
    return () => {
      current = false;
    };
  }, [recordId]);

  if (error) {
    return (
      <Alert variant="light" color="red" icon={<IoMdAlert />}>
        {error}
      </Alert>
    );
  }

  if (!details) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  const { record } = details;
  const schema = details.schema ?? undefined;
  const source = record.source;
  const product = record.model;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" gap="sm">
        <Group gap="xs" align="center">
          {source && (
            <>
              <Anchor
                component={Link}
                href={routes.productSources.details(source.id)}
                fw={600}
                size="sm"
              >
                {source.name}
              </Anchor>
              {source.type && (
                <Badge
                  color={PRODUCT_SOURCE_TYPE_COLORS[source.type]}
                  variant="light"
                  size="sm"
                  tt="none"
                >
                  {source.type}
                </Badge>
              )}
              {source.seller && (
                <Text size="sm" c="dimmed">
                  {source.seller.name}
                </Text>
              )}
            </>
          )}
        </Group>

        {product ? (
          <Button
            component={Link}
            href={routes.products.details(product.id)}
            variant="light"
            size="xs"
            rightSection={<FaArrowRight size={11} />}
          >
            {product.displayName}
          </Button>
        ) : (
          <Badge color="orange" variant="light">
            Unattached
          </Badge>
        )}
      </Group>

      <ListingDetails
        listing={record}
        schema={schema}
        specRows={listingSpecRows(record, schema)}
      />
    </Stack>
  );
}

export function ProductSourceRecordDetailsModal({
  row,
  onClose,
}: {
  /** The listing to show; null keeps the modal closed. */
  row: ProductSourceRecordRow | null;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={row !== null}
      onClose={onClose}
      size="80rem"
      title={
        <Text fw={600} lineClamp={1}>
          {row?.title ?? row?.url ?? "Listing"}
        </Text>
      }
    >
      {row && <RecordDetailsBody key={row.id} recordId={row.id} />}
    </Modal>
  );
}
