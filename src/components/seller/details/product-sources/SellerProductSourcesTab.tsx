"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { format } from "date-fns";
import { useAppSelector } from "@/store/store-hooks";
import { selectSeller } from "@/store/slices/seller-slice";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import { useSellerProductSourceSearch } from "@/hooks/useSellerProductSourceSearch";
import { CreateProductSourceAction } from "./CreateProductSourceAction";
import { EditProductSourceModal } from "./EditProductSourceModal";

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  return format(new Date(value), "yyyy-MM-dd HH:mm:ss");
};

export function SellerProductSourcesTab() {
  const seller = useAppSelector(selectSeller);
  const [editing, setEditing] = useState<ProductSource | null>(null);

  const { search, loading, searchResult } = useSellerProductSourceSearch();

  const sellerId = seller?.id;

  useEffect(() => {
    if (sellerId) {
      search(sellerId, { pageSize: 100 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  if (!sellerId) {
    return null;
  }

  const productSources = searchResult?.items ?? [];

  const refresh = () => {
    search(sellerId, { pageSize: 100 });
  };

  return (
    <Stack gap="md">
      <Group justify="flex-end">
        <CreateProductSourceAction sellerId={sellerId} onCreated={refresh} />
      </Group>

      {loading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : productSources.length === 0 ? (
        <Center p="xl">
          <Text c="dimmed">No product sources yet</Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {productSources.map((source) => (
            <Card key={source.id} withBorder padding="md" radius="sm">
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Text fw={600} lineClamp={1}>
                    {source.name}
                  </Text>
                  <Badge
                    color={source.schedulingEnabled ? "green" : "gray"}
                    tt="none"
                  >
                    {source.schedulingEnabled ? "Scheduling on" : "Scheduling off"}
                  </Badge>
                </Group>

                <Group gap="xs">
                  <Badge
                    color={source.processingEnabled ? "green" : "gray"}
                    variant="light"
                    tt="none"
                  >
                    {source.processingEnabled ? "Processing on" : "Processing off"}
                  </Badge>
                  <Badge variant="light" color="gray" tt="none">
                    Priority {source.priority}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed">
                  Max concurrent: {source.maxConcurrent} · Requests/hour:{" "}
                  {source.requestsPerHour}
                </Text>

                <Text size="sm" c="dimmed">
                  Last run: {formatDate(source.lastRunAt)}
                </Text>
                <Text size="sm" c="dimmed">
                  Next full sync: {formatDate(source.nextFullSyncAt)}
                </Text>
                <Text size="sm" c="dimmed">
                  Next incremental sync: {formatDate(source.nextIncrementalSyncAt)}
                </Text>

                <Button
                  variant="light"
                  size="xs"
                  mt="sm"
                  onClick={() => setEditing(source)}
                >
                  Edit
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {editing && (
        <EditProductSourceModal
          productSource={editing}
          opened={!!editing}
          onClose={() => setEditing(null)}
          onUpdated={refresh}
        />
      )}
    </Stack>
  );
}
