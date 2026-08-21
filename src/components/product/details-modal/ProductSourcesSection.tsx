"use client";

import {
  Anchor,
  Badge,
  Button,
  Code,
  Popover,
  ScrollArea,
  Table,
  Text,
} from "@mantine/core";
import { format } from "date-fns";
import { ReactNode } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { ProductSourceRecord } from "@/models/product-source";

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "yyyy-MM-dd HH:mm");
}

function SpecValidCell({ source }: { source: ProductSourceRecord }) {
  if (source.specValid == null) {
    return (
      <Text size="xs" c="dimmed">
        —
      </Text>
    );
  }
  if (source.specValid) {
    return (
      <Badge
        color="green"
        variant="light"
        size="sm"
        leftSection={<FaCheck size={9} />}
      >
        valid
      </Badge>
    );
  }
  return (
    <Badge
      color="red"
      variant="light"
      size="sm"
      leftSection={<FaTimes size={9} />}
    >
      invalid
    </Badge>
  );
}

function JsonPopover({
  data,
  trigger,
}: {
  data: unknown;
  trigger: ReactNode;
}) {
  return (
    <Popover position="bottom-start" withArrow shadow="md" withinPortal>
      <Popover.Target>
        <span style={{ cursor: "pointer" }}>{trigger}</span>
      </Popover.Target>
      <Popover.Dropdown p="xs">
        <Code
          block
          style={{ maxWidth: 520, maxHeight: 360, overflow: "auto" }}
        >
          {JSON.stringify(data, null, 2)}
        </Code>
      </Popover.Dropdown>
    </Popover>
  );
}

function SpecErrorsCell({
  errors,
}: {
  errors?: Record<string, unknown>;
}) {
  if (!errors || Object.keys(errors).length === 0) {
    return (
      <Text size="xs" c="dimmed">
        —
      </Text>
    );
  }
  const count = Object.keys(errors).length;
  return (
    <JsonPopover
      data={errors}
      trigger={
        <Badge color="red" variant="light" size="sm">
          {count} error{count === 1 ? "" : "s"}
        </Badge>
      }
    />
  );
}

export function ProductSourcesSection({
  sources,
}: {
  sources?: ProductSourceRecord[];
}) {
  if (!sources || sources.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No sources.
      </Text>
    );
  }
  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder withColumnBorders fz="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Supplier</Table.Th>
            <Table.Th>Source name</Table.Th>
            <Table.Th>Normalized</Table.Th>
            <Table.Th>External ID</Table.Th>
            <Table.Th>URL</Table.Th>
            <Table.Th>Spec valid</Table.Th>
            <Table.Th>Spec errors</Table.Th>
            <Table.Th>Specs</Table.Th>
            <Table.Th>Deduplicated</Table.Th>
            <Table.Th>Last updated</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sources.map((source) => {
            const specs = source.scrapedProduct?.specs;
            const specCount = specs ? Object.keys(specs).length : 0;
            return (
              <Table.Tr key={source.id}>
                <Table.Td>{source.source?.name ?? "Manual"}</Table.Td>
                <Table.Td>{source.sourceName ?? "—"}</Table.Td>
                <Table.Td>
                  {source.normalizedSourceName ? (
                    <Code>{source.normalizedSourceName}</Code>
                  ) : (
                    "—"
                  )}
                </Table.Td>
                <Table.Td>
                  {source.externalId ? (
                    <Code>{source.externalId}</Code>
                  ) : (
                    "—"
                  )}
                </Table.Td>
                <Table.Td style={{ maxWidth: 240 }}>
                  {source.url ? (
                    <Anchor
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      size="xs"
                      style={{
                        display: "inline-block",
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      {source.url}
                    </Anchor>
                  ) : (
                    "—"
                  )}
                </Table.Td>
                <Table.Td>
                  <SpecValidCell source={source} />
                </Table.Td>
                <Table.Td>
                  <SpecErrorsCell errors={source.specErrors} />
                </Table.Td>
                <Table.Td>
                  {specCount > 0 ? (
                    <JsonPopover
                      data={specs}
                      trigger={
                        <Button variant="light" color="gray" size="compact-xs">
                          {specCount}
                        </Button>
                      }
                    />
                  ) : (
                    <Text size="xs" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {source.deduplicated ? (
                    <Badge color="orange" variant="light" size="sm">
                      yes
                    </Badge>
                  ) : (
                    <Text size="xs" c="dimmed">
                      no
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>{formatTimestamp(source.lastUpdated)}</Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
