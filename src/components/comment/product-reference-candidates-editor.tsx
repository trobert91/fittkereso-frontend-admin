"use client";

import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Image,
  Modal,
  NumberInput,
  Progress,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { FaSearch, FaTrash, FaPlus } from "react-icons/fa";
import { ProductModel } from "@/models/product-model";
import { ProductReferenceCandidate } from "@/models/product-reference-candidate";
import { ProductTable } from "@/components/product/product-table";

const CANDIDATE_IMAGE_SIZE = 96;

/**
 * Editable in-memory candidate row used by the candidates-editor modal table.
 * Carries enough of `ProductReferenceCandidate` to round-trip back into the
 * reference on save, but stays decoupled from the persisted entity so the
 * editor can hold un-saved synthetic ids ("draft-…") until the wire mapper
 * normalises them.
 */
export interface CandidateDraft {
  id: string;
  model: ProductModel;
  confidence: number;
  isPrimary: boolean;
}

/**
 * Table editor for a reference's candidate set. Each row displays image + name
 * + brand, an editable confidence field, a primary toggle, a search button
 * (replaces this row's product), and a delete button. The "add candidate"
 * action below the table opens the product picker to append a new row.
 *
 * The editor doesn't compute weights — the backend re-derives them via softmax
 * from confidence at save time. The editor enforces exactly-one primary by
 * promoting another row when the current primary is deleted or de-flagged.
 */
export function ProductReferenceCandidatesEditor({
  candidates,
  onChange,
}: {
  candidates: CandidateDraft[];
  onChange: (next: CandidateDraft[]) => void;
}) {
  const [pickerState, setPickerState] = useState<
    { mode: "add" } | { mode: "replace"; index: number } | null
  >(null);

  const promoteFirstIfNoPrimary = (rows: CandidateDraft[]): CandidateDraft[] => {
    if (rows.length === 0) return rows;
    if (rows.some((row) => row.isPrimary)) return rows;
    return rows.map((row, i) => (i === 0 ? { ...row, isPrimary: true } : row));
  };

  const setPrimary = (index: number) => {
    onChange(
      candidates.map((row, i) => ({ ...row, isPrimary: i === index })),
    );
  };

  const setConfidence = (index: number, value: number) => {
    onChange(
      candidates.map((row, i) =>
        i === index ? { ...row, confidence: value } : row,
      ),
    );
  };

  const remove = (index: number) => {
    const next = candidates.filter((_, i) => i !== index);
    onChange(promoteFirstIfNoPrimary(next));
  };

  const handlePick = (model: ProductModel) => {
    if (!pickerState) return;
    const draft: CandidateDraft = {
      id: `draft-${model.id}-${Date.now()}`,
      model,
      confidence: 100,
      isPrimary: candidates.length === 0,
    };
    if (pickerState.mode === "add") {
      onChange([...candidates, draft]);
    } else {
      // Preserve primary flag when replacing — picking a new model in a primary
      // row keeps the row primary.
      onChange(
        candidates.map((row, i) =>
          i === pickerState.index
            ? { ...draft, isPrimary: row.isPrimary }
            : row,
        ),
      );
    }
    setPickerState(null);
  };

  return (
    <Box>
      <Group justify="space-between" mb="xs" align="center">
        <Text size="sm" fw={500}>
          candidates
        </Text>
        <Button
          size="compact-xs"
          variant="light"
          leftSection={<FaPlus size={9} />}
          onClick={() => setPickerState({ mode: "add" })}
        >
          add candidate
        </Button>
      </Group>

      {candidates.length === 0 ? (
        <Box
          p="sm"
          style={{
            border: "1px dashed var(--mantine-color-dark-4)",
            borderRadius: "var(--mantine-radius-sm)",
            textAlign: "center",
          }}
        >
          <Text size="xs" c="dimmed">
            no candidates — reference is unresolved
          </Text>
        </Box>
      ) : (
        <Table withTableBorder withColumnBorders verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: CANDIDATE_IMAGE_SIZE + 24 }}>image</Table.Th>
              <Table.Th>candidate</Table.Th>
              <Table.Th style={{ width: 90 }}>primary</Table.Th>
              <Table.Th style={{ width: 90 }}>actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {candidates.map((row, index) => {
              const model = row.model;
              const imgUrl = model?.mainImage?.url || model?.images?.[0]?.url;
              const displayName = model?.displayName || model?.model || "—";
              return (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={displayName}
                        w={CANDIDATE_IMAGE_SIZE}
                        h={CANDIDATE_IMAGE_SIZE}
                        fit="contain"
                        radius="sm"
                      />
                    ) : (
                      <Box
                        style={{
                          width: CANDIDATE_IMAGE_SIZE,
                          height: CANDIDATE_IMAGE_SIZE,
                          background: "var(--mantine-color-dark-6)",
                          borderRadius: "var(--mantine-radius-xs)",
                        }}
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={6}>
                      <Text size="sm" fw={500} style={{ width: "100%" }}>
                        {displayName}
                      </Text>
                      <Group gap="xs" wrap="nowrap" align="center">
                        <Progress
                          value={Math.max(0, Math.min(100, row.confidence))}
                          size="md"
                          radius="sm"
                          style={{ flex: 1 }}
                        />
                        <NumberInput
                          size="xs"
                          value={row.confidence}
                          onChange={(value) =>
                            setConfidence(
                              index,
                              typeof value === "number"
                                ? value
                                : parseFloat(value ?? "0") || 0,
                            )
                          }
                          min={0}
                          max={100}
                          step={1}
                          allowDecimal={false}
                          w={70}
                        />
                      </Group>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    {row.isPrimary ? (
                      <Badge color="blue" variant="filled" size="sm" tt="none">
                        primary
                      </Badge>
                    ) : (
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="gray"
                        onClick={() => setPrimary(index)}
                      >
                        make primary
                      </Button>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="search & replace this product" withArrow>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="gray"
                          onClick={() =>
                            setPickerState({ mode: "replace", index })
                          }
                        >
                          <FaSearch size={11} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="remove candidate" withArrow>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => remove(index)}
                        >
                          <FaTrash size={11} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={pickerState !== null}
        onClose={() => setPickerState(null)}
        title={
          pickerState?.mode === "replace"
            ? "Replace candidate product"
            : "Add candidate product"
        }
        size="100%"
      >
        <ProductTable
          showProductDetailsLink={false}
          onSelectProduct={handlePick}
        />
      </Modal>
    </Box>
  );
}
