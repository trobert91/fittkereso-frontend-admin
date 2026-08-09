"use client";

import { useMemo, useState } from "react";
import { Badge, Box, Group, Image, Progress, Stack, Text, Tooltip } from "@mantine/core";
import { LuPlus } from "react-icons/lu";
import { orderBy } from "lodash";
import { ProductReferenceCandidate } from "@/models/product-reference-candidate";
import { ProductDetailsModal } from "@/components/product/details-modal";

const STRIP_LIMIT = 2;
const CARD_WIDTH = 220;
const IMAGE_HEIGHT = 130;

/**
 * Horizontal strip of up to two highest-confidence resolution candidates.
 * Each card carries the product image, the product name full-width, and a
 * confidence progress bar with tooltip. When more than `STRIP_LIMIT`
 * candidates exist, an inline "+N" badge appears next to the cards.
 *
 * Clicking a card opens that product's detail modal. Search & replace and
 * "add candidate" actions live in the edit modal's candidate table — the
 * inline strip is read-only.
 */
export function ProductReferenceCandidateStrip({
  candidates,
  fallbackName,
}: {
  candidates: ProductReferenceCandidate[] | undefined;
  fallbackName: string;
}) {
  const [detailModelId, setDetailModelId] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (!candidates || candidates.length === 0) return [];
    return orderBy(
      candidates,
      [(c) => c.confidence ?? 0, (c) => (c.isPrimary ? 1 : 0)],
      ["desc", "desc"],
    ).slice(0, STRIP_LIMIT);
  }, [candidates]);

  const hiddenCount = Math.max((candidates?.length ?? 0) - visible.length, 0);

  return (
    <>
      <Stack gap="sm" align="stretch">
        {visible.length === 0 && (
          <Box
            p="sm"
            style={{
              width: CARD_WIDTH,
              minHeight: IMAGE_HEIGHT + 60,
              border: "1px dashed var(--mantine-color-dark-4)",
              borderRadius: "var(--mantine-radius-sm)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text size="sm" c="dimmed" ta="center">
              {fallbackName}
            </Text>
            <Badge color="gray" variant="light" size="sm" tt="none">
              unresolved
            </Badge>
          </Box>
        )}

        {visible.map((candidate) => {
          const model = candidate.model;
          const displayName =
            model?.displayName || model?.model || fallbackName;
          const confidence = Math.round(candidate.confidence ?? 0);
          const weightPct = Math.round((candidate.weight ?? 0) * 100);
          const imgUrl = model?.mainImage?.url ?? model?.images?.[0]?.url;
          const tooltipText = [
            `confidence: ${confidence}`,
            `weight: ${weightPct}%`,
            candidate.isPrimary ? "primary candidate" : "runner-up",
          ].join(" · ");

          return (
            <Box
              key={candidate.id}
              p="xs"
              style={{
                width: CARD_WIDTH,
                cursor: model?.id ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
              onClick={() => {
                if (model?.id) setDetailModelId(model.id);
              }}
            >
              <Box
                style={{
                  height: IMAGE_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--mantine-color-dark-7)",
                  borderRadius: "var(--mantine-radius-xs)",
                  overflow: "hidden",
                }}
              >
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={displayName}
                    h={IMAGE_HEIGHT}
                    w={CARD_WIDTH}
                    fit="contain"
                  />
                ) : (
                  <Text size="xs" c="dimmed">
                    no image
                  </Text>
                )}
              </Box>
              <Stack gap={4}>
                <Text size="xs" fw={600} lineClamp={2} style={{ width: "100%" }}>
                  {displayName}
                </Text>
                <Tooltip label={tooltipText} withArrow>
                  <Group gap={6} wrap="nowrap" align="center">
                    <Progress
                      value={Math.max(0, Math.min(100, confidence))}
                      size="sm"
                      radius="sm"
                      style={{ flex: 1 }}
                    />
                    <Text size="xs" c="dimmed" style={{ minWidth: 22, textAlign: "right" }}>
                      {confidence}
                    </Text>
                  </Group>
                </Tooltip>
              </Stack>
            </Box>
          );
        })}

        {hiddenCount > 0 && (
          <Tooltip
            label={`${hiddenCount} more candidate${hiddenCount === 1 ? "" : "s"} below the top ${STRIP_LIMIT}`}
            withArrow
          >
            <Badge
              color="gray"
              variant="light"
              size="sm"
              tt="none"
              leftSection={<LuPlus size={10} />}
              style={{ alignSelf: "center" }}
            >
              {hiddenCount} candidate{hiddenCount === 1 ? "" : "s"}
            </Badge>
          </Tooltip>
        )}
      </Stack>

      <ProductDetailsModal
        productId={detailModelId}
        opened={detailModelId !== null}
        onClose={() => setDetailModelId(null)}
      />
    </>
  );
}
