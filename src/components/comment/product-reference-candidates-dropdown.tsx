"use no memo";

import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Image,
  Menu,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { LuChevronDown } from "react-icons/lu";
import { orderBy } from "lodash";
import { useMemo } from "react";
import { ProductModel } from "@/models/product-model";
import { ProductReferenceCandidate } from "@/models/product-reference-candidate";
import { ProductSpecsBadges } from "@/components/product/product-specs-badges";

const PLACEHOLDER_IMAGE_SIZE = 48;

/**
 * Dropdown showing the candidate set on a `ProductReference`. The primary
 * candidate is the resolver's top pick (`isPrimary === true`); other rows
 * are runner-ups that share the user's vote in ambiguous-resolution cases.
 * Selecting a row issues `onSelect(model)` which the parent feeds into the
 * comment update payload, promoting the chosen model to primary.
 */
export function ProductReferenceCandidatesDropdown({
  candidates,
  currentModelId,
  onSelect,
}: {
  candidates: ProductReferenceCandidate[];
  currentModelId?: string;
  onSelect: (model: ProductModel) => void;
}) {
  const ordered = useMemo(
    () =>
      orderBy(
        candidates,
        [(c) => (c.isPrimary ? 1 : 0), (c) => c.weight ?? 0, (c) => c.confidence ?? 0],
        ["desc", "desc", "desc"],
      ),
    [candidates],
  );

  if (!ordered || ordered.length === 0) return null;

  return (
    <Menu shadow="md" width={520} position="bottom-start" closeOnItemClick={false}>
      <Menu.Target>
        <Tooltip label="Resolution candidates — primary first, runner-ups below">
          <ActionIcon variant="light" color="blue" size="md">
            <LuChevronDown size={16} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          {ordered.length} candidate{ordered.length === 1 ? "" : "s"}
        </Menu.Label>
        {ordered.map((candidate) => {
          const model = candidate.model;
          if (!model) return null;
          const isCurrent = model.id === currentModelId;
          const imgUrl = model.mainImage?.url || model.images?.[0]?.url;
          const displayName = model.displayName || model.model || "-";
          const weightPct = Math.round((candidate.weight ?? 0) * 100);
          const confidencePct = Math.round(candidate.confidence ?? 0);

          return (
            <Menu.Item
              key={candidate.id}
              p="xs"
              style={{
                borderLeft: isCurrent ? "3px solid var(--mantine-color-blue-6)" : undefined,
              }}
            >
              <Group align="flex-start" wrap="nowrap" gap="sm">
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={displayName}
                    radius="sm"
                    w={PLACEHOLDER_IMAGE_SIZE}
                    h={PLACEHOLDER_IMAGE_SIZE}
                    fit="cover"
                  />
                ) : (
                  <div style={{ width: PLACEHOLDER_IMAGE_SIZE, height: PLACEHOLDER_IMAGE_SIZE }} />
                )}

                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap">
                    {candidate.isPrimary ? (
                      <Badge size="xs" color="blue" variant="filled">
                        primary
                      </Badge>
                    ) : (
                      <Badge size="xs" color="gray" variant="light">
                        runner-up
                      </Badge>
                    )}
                    <Text size="sm" fw={500} truncate>
                      {displayName}
                    </Text>
                    {isCurrent && (
                      <Badge size="xs" color="blue">
                        current
                      </Badge>
                    )}
                  </Group>

                  <Group gap={6} wrap="wrap">
                    {model.brand?.name && (
                      <Text size="xs" c="dimmed">
                        {model.brand.name}
                      </Text>
                    )}
                    {model.productCategory?.name && (
                      <Text size="xs" c="dimmed">
                        · {model.productCategory.name}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      · confidence {confidencePct}
                    </Text>
                    <Text size="xs" c="dimmed">
                      · weight {weightPct}%
                    </Text>
                  </Group>

                  <ProductSpecsBadges specs={model.orderedSpecs} />
                </Stack>

                <Button
                  size="xs"
                  variant={isCurrent ? "outline" : "filled"}
                  disabled={isCurrent}
                  onClick={() => onSelect(model)}
                >
                  {isCurrent ? "Selected" : "Select"}
                </Button>
              </Group>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
