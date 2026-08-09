"use client";

import { Anchor, Badge, CopyButton, Group, Table, Text, Tooltip } from "@mantine/core";
import { ProductSourceType } from "@/models/product-source";
import { selectProduct } from "@/store/slices/product-slice";
import { useAppSelector } from "@/store/store-hooks";
import { DeleteSourceButton } from "./DeleteSourceButton";
import { ResyncSourceButton } from "./ResyncSourceButton";

const sourceTypeColorMap: Record<ProductSourceType, string> = {
  [ProductSourceType.arukereso]: "blue",
  [ProductSourceType.displaySpecs]: "violet",
  [ProductSourceType.manual]: "gray",
};

const formatDateTime = (value?: string): string => {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString();
};

export function ProductSourcesTab() {
  const product = useAppSelector(selectProduct);

  if (!product) {
    return null;
  }

  const sources = product.sources ?? [];

  if (!sources.length) {
    return <Text c="dimmed">No sources</Text>;
  }

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>ID</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>URL</Table.Th>
          <Table.Th>Spec Valid</Table.Th>
          <Table.Th>Spec Errors</Table.Th>
          <Table.Th>Source Name</Table.Th>
          <Table.Th>Normalized Source Name</Table.Th>
          <Table.Th>Deduplicated</Table.Th>
          <Table.Th>Last Updated</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {sources.map((source) => {
          const canResync =
            source.type !== ProductSourceType.manual && Boolean(source.url);

          return (
            <Table.Tr key={source.id}>
              <Table.Td>
                <CopyButton value={source.id}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied!" : "Copy ID"} withArrow>
                      <Badge
                        color={copied ? "green" : "gray"}
                        variant="outline"
                        style={{ cursor: "pointer" }}
                        onClick={copy}
                      >
                        {source.id.slice(0, 8)}…
                      </Badge>
                    </Tooltip>
                  )}
                </CopyButton>
              </Table.Td>

              <Table.Td>
                <Badge color={sourceTypeColorMap[source.type]}>
                  {source.type}
                </Badge>
              </Table.Td>

              <Table.Td>
                {source.url ? (
                  <Anchor href={source.url} target="_blank" rel="noreferrer">
                    {source.url}
                  </Anchor>
                ) : (
                  <Text c="dimmed">—</Text>
                )}
              </Table.Td>

              <Table.Td>
                <Badge color={source.specValid ? "green" : "red"}>
                  {source.specValid ? "Valid" : "Invalid"}
                </Badge>
              </Table.Td>

              <Table.Td>
                {source.specErrors && Object.keys(source.specErrors).length ? (
                  <Tooltip
                    label={
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(source.specErrors, null, 2)}
                      </pre>
                    }
                    multiline
                    w={400}
                    withArrow
                  >
                    <Badge color="red" variant="light">
                      {Object.keys(source.specErrors).length} error
                      {Object.keys(source.specErrors).length === 1 ? "" : "s"}
                    </Badge>
                  </Tooltip>
                ) : (
                  <Text c="dimmed">—</Text>
                )}
              </Table.Td>

              <Table.Td>
                {source.sourceName ? (
                  <Text size="sm">{source.sourceName}</Text>
                ) : (
                  <Text c="dimmed">—</Text>
                )}
              </Table.Td>

              <Table.Td>
                {source.normalizedSourceName ? (
                  <Text size="sm">{source.normalizedSourceName}</Text>
                ) : (
                  <Text c="dimmed">—</Text>
                )}
              </Table.Td>

              <Table.Td>
                {source.deduplicated ? (
                  <Badge color="orange" variant="light">Deduplicated</Badge>
                ) : (
                  <Text c="dimmed">—</Text>
                )}
              </Table.Td>

              <Table.Td>{formatDateTime(source.lastUpdated)}</Table.Td>

              <Table.Td>
                <Group gap="xs">
                  {canResync && source.url ? (
                    <ResyncSourceButton
                      productId={product.id}
                      productModelSourceId={source.id}
                      sourceUrl={source.url}
                    />
                  ) : null}
                  <DeleteSourceButton
                    productId={product.id}
                    sourceId={source.id}
                  />
                </Group>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
