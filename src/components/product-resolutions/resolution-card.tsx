"use client";

import { useMemo, useState } from "react";
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Card,
  Collapse,
  CopyButton,
  Group,
  LoadingOverlay,
  Menu,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { isEmpty } from "lodash";
import { FaCheck, FaCopy, FaTimes } from "react-icons/fa";
import { IoChevronDown, IoChevronUp, IoEye, IoTrash, IoWarning } from "react-icons/io5";
import { LuExternalLink } from "react-icons/lu";
import { MdRateReview } from "react-icons/md";
import { PiDotsThree } from "react-icons/pi";
import {
  deleteResolution,
  ProductResolutionRecord,
  ResolutionListItem,
} from "@/api-actions/product/product-resolutions";
import { ScoreRing } from "@/components/score-ring";
import { ColoredBadge } from "@/components/colored-badge";
import { formatDate } from "@/utils/date";
import { routes } from "@/utils/routes";
import { ResolutionActions } from "./resolution-actions";
import { ResolutionCandidateStrip } from "./resolution-candidate-strip";
import { ResolutionEvidence } from "./resolution-evidence";
import { ResolutionPairStrip } from "./resolution-pair-strip";
import { ResolutionReviewModal } from "./resolution-review-modal";
import {
  ACTION_KIND_LABELS,
  FLOW_COLORS,
  FLOW_LABELS,
  ORIGIN_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  failedGateCount,
  systemDecision,
} from "./resolution-labels";

const REASON_TRUNCATE_LIMIT = 240;

/**
 * One review-queue row.
 *
 * Closed, it answers "do I need to touch this?" — status, score, confidence,
 * the products with pictures, and the two counts that predict a bad automated
 * call (failed gates, spec mismatches). Expanded, it answers "what exactly
 * happened?" — the full candidate evidence and where the listing lives now. The
 * modal answers "what has been decided, and what do I decide?" — the log plus
 * the corrections that need input.
 *
 * Shell, badge strip and action row mirror the userscores comment card.
 */
export function ResolutionCard({
  item,
  onUpdated,
  onDeleted,
}: {
  item: ResolutionListItem;
  onUpdated: (updated: ResolutionListItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [justActed, setJustActed] = useState(false);

  const { resolution, state } = item;
  const statusColor = STATUS_COLORS[resolution.status] ?? "gray";

  const handleUpdated = (updated: ResolutionListItem) => {
    // Keep the row on screen after a decision instead of letting it vanish out
    // of the open-status filter — the reviewer needs to see what happened and
    // be able to re-open a mis-click.
    setJustActed(true);
    onUpdated(updated);
  };

  const handleDelete = () => {
    modals.openConfirmModal({
      title: "Delete resolution record",
      children: (
        <Text size="sm">
          Delete this record? The products themselves are not affected — you just
          lose the decision history for this situation.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteResolution(resolution.id);
          onDeleted(resolution.id);
        } catch (err) {
          notifications.show({
            color: "red",
            title: "Delete failed",
            message: err instanceof Error ? err.message : "An error occurred",
          });
        }
      },
    });
  };

  return (
    <>
      <Card
        withBorder
        shadow="sm"
        padding="md"
        radius="sm"
        pos="relative"
        bd={`2px solid ${statusColor}`}
      >
        <LoadingOverlay visible={busy} zIndex={200} overlayProps={{ blur: 2 }} />

        <Card.Section
          inheritPadding
          py="sm"
          bg={`var(--mantine-color-${statusColor}-light)`}
        >
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <Group gap="xs" wrap="wrap">
              <Badge color={statusColor} variant="light" size="sm" tt="none">
                {STATUS_LABELS[resolution.status]}
              </Badge>

              <ScoreRing
                rate={resolution.similarityScore}
                size={30}
                thickness={4}
                tooltip={`similarity: ${resolution.similarityScore}`}
              />

              <Button
                size="compact-xs"
                variant={resolution.accepted ? "filled" : "outline"}
                color={resolution.accepted ? "green" : "gray"}
                style={{ pointerEvents: "none" }}
                leftSection={
                  resolution.accepted ? (
                    <FaCheck size={10} />
                  ) : (
                    <FaTimes size={10} />
                  )
                }
              >
                {resolution.accepted ? "accepted" : "not accepted"}
              </Button>

              <Badge
                color={FLOW_COLORS[resolution.flow]}
                variant="light"
                size="sm"
                tt="none"
              >
                {FLOW_LABELS[resolution.flow]}
              </Badge>

              {resolution.origin && (
                <Badge color="gray" variant="outline" size="sm" tt="none">
                  {ORIGIN_LABELS[resolution.origin]}
                </Badge>
              )}

              {resolution.decisionConfidence != null && (
                <ColoredBadge
                  value={resolution.decisionConfidence}
                  label="confidence"
                />
              )}

              <SignalBadges resolution={resolution} />

              {resolution.createdAt && (
                <Badge color="gray" variant="light" size="sm" tt="none">
                  created: {formatDate(resolution.createdAt, "yyyy-MM-dd")}
                </Badge>
              )}
              {resolution.lastSeenAt && (
                <Tooltip
                  label="Last time this exact situation was scraped again."
                  withArrow
                >
                  <Badge color="gray" variant="light" size="sm" tt="none">
                    last seen: {formatDate(resolution.lastSeenAt, "yyyy-MM-dd")}
                  </Badge>
                </Tooltip>
              )}

              {justActed && (
                <Badge color="blue" variant="light" size="sm" tt="none">
                  just decided — leaves the queue on refresh
                </Badge>
              )}
            </Group>

            <RowMenu
              resolution={resolution}
              listingProductId={state.listingProductId}
              onDelete={handleDelete}
            />
          </Group>
        </Card.Section>

        <Card.Section withBorder inheritPadding py="md">
          <VerdictLine item={item} />
        </Card.Section>

        <Card.Section withBorder inheritPadding py="md">
          {resolution.flow === "duplicate_detection" ? (
            <ResolutionPairStrip
              resolution={resolution}
              showMergeDirection={!state.lastPerformed}
            />
          ) : (
            <ResolutionCandidateStrip resolution={resolution} />
          )}
        </Card.Section>

        <Collapse in={expanded}>
          <Card.Section withBorder inheritPadding>
            <ResolutionEvidence item={item} />
          </Card.Section>
        </Collapse>

        <Card.Section withBorder inheritPadding py="sm">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <ResolutionActions
              item={item}
              onUpdated={handleUpdated}
              onBusyChange={setBusy}
            />

            <Group gap="xs">
              <Button
                size="compact-xs"
                variant="light"
                color="gray"
                leftSection={<MdRateReview size={12} />}
                onClick={() => setReviewOpen(true)}
              >
                Review & decide
              </Button>
              <Tooltip
                label={expanded ? "Hide the evidence" : "Show all the evidence"}
                withArrow
              >
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setExpanded((value) => !value)}
                  aria-label={expanded ? "collapse" : "expand"}
                >
                  {expanded ? (
                    <IoChevronUp size={16} />
                  ) : (
                    <IoChevronDown size={16} />
                  )}
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Card.Section>
      </Card>

      <ResolutionReviewModal
        resolutionId={reviewOpen ? resolution.id : null}
        onClose={() => setReviewOpen(false)}
        onUpdated={handleUpdated}
      />
    </>
  );
}

/** The "can I skip this row?" badges — everything here is a reason to look
 *  closer, so an empty strip means the automated call was clean. */
function SignalBadges({ resolution }: { resolution: ProductResolutionRecord }) {
  const gates = failedGateCount(resolution);
  const specs = resolution.specMatchDetails;
  const lastEntry = resolution.decisions?.[resolution.decisions.length - 1];

  return (
    <>
      {gates > 0 && (
        <Tooltip
          label="Candidates rejected by a hard gate (brand, category, variant…). A high count next to a confident decision is worth a look."
          withArrow
          multiline
          maw={320}
        >
          <Badge color="red" variant="light" size="sm" tt="none">
            {gates} gate{gates === 1 ? "" : "s"} failed
          </Badge>
        </Tooltip>
      )}

      {specs && specs.comparableCount > 0 && (
        <Tooltip
          label={
            specs.primaryMismatches > 0
              ? `${specs.primaryMismatches} identity-defining spec${specs.primaryMismatches === 1 ? "" : "s"} disagree`
              : "All identity-defining specs agree"
          }
          withArrow
        >
          <Badge
            color={specs.primaryMismatches > 0 ? "red" : "gray"}
            variant="light"
            size="sm"
            tt="none"
          >
            {specs.matchingCount}/{specs.comparableCount} specs
          </Badge>
        </Tooltip>
      )}

      {!isEmpty(resolution.pendingReasons) && (
        <Tooltip
          label={resolution.pendingReasons!.join("\n")}
          withArrow
          multiline
          maw={380}
        >
          <Badge color="orange" variant="light" size="sm" tt="none">
            {resolution.pendingReasons!.length} pending reason
            {resolution.pendingReasons!.length === 1 ? "" : "s"}
          </Badge>
        </Tooltip>
      )}

      {lastEntry?.error && (
        <Tooltip label={lastEntry.error} withArrow multiline maw={380}>
          <Badge
            color="red"
            variant="filled"
            size="sm"
            tt="none"
            leftSection={<IoWarning size={10} />}
          >
            action failed
          </Badge>
        </Tooltip>
      )}
    </>
  );
}

/** One sentence: what the system concluded, and what a human has done since. */
function VerdictLine({ item }: { item: ResolutionListItem }) {
  const [expanded, setExpanded] = useState(false);
  const { resolution, state } = item;

  const seed = systemDecision(resolution);
  const performed = state.lastPerformed;

  const sentence = useMemo(() => {
    const named = (id?: string) => {
      if (!id) return "a product";
      const match = [
        resolution.productA,
        resolution.productB,
        resolution.resolvedProduct,
        resolution.sourceRecord?.model,
      ].find((product) => product?.id === id);
      return match?.displayName ?? "a product";
    };

    switch (seed?.verdict) {
      case "matched_existing":
        return `The system matched this listing to ${named(seed.action.productId)}.`;
      case "created_new":
        return "The system found no match and created a new product for this listing.";
      case "duplicate_proposed":
        return `The system flagged ${resolution.productA?.displayName ?? "these two products"} and ${resolution.productB?.displayName ?? "another"} as duplicates. Nothing has been merged yet.`;
      default:
        return "No system verdict was recorded for this row.";
    }
  }, [seed, resolution]);

  // The correction on offer is derived from the last *performed* action, so
  // saying what that was is what makes the available buttons make sense.
  const since =
    performed && performed.actor === "admin"
      ? `You ${performed.verdict === "accept" ? "accepted" : "declined"} this on ${formatDate(performed.at, "yyyy-MM-dd")} — ${ACTION_KIND_LABELS[performed.action.kind]}.`
      : undefined;

  const reason = resolution.decisionSnapshot?.reason;
  const truncatable = !!reason && reason.length > REASON_TRUNCATE_LIMIT;

  return (
    <Stack gap={6}>
      <Text size="sm">{sentence}</Text>

      {since && (
        <Text size="sm" c="dimmed">
          {since}
        </Text>
      )}

      {reason && (
        <Text size="xs" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
          {truncatable && !expanded
            ? `${reason.slice(0, REASON_TRUNCATE_LIMIT)}… `
            : `${reason} `}
          {truncatable && (
            <Anchor
              component="button"
              size="xs"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show less" : "Show more"}
            </Anchor>
          )}
        </Text>
      )}

      {!isEmpty(resolution.pendingReasons) && (
        <Stack gap={2}>
          {resolution.pendingReasons!.map((pendingReason, index) => (
            <Text key={index} size="xs" c="dimmed">
              · {pendingReason}
            </Text>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function RowMenu({
  resolution,
  listingProductId,
  onDelete,
}: {
  resolution: ProductResolutionRecord;
  listingProductId?: string;
  onDelete: () => void;
}) {
  const products = [
    { label: "Product A", product: resolution.productA },
    { label: "Product B", product: resolution.productB },
    { label: "Resolved product", product: resolution.resolvedProduct },
    {
      label: "Listing sits on",
      product:
        resolution.sourceRecord?.model?.id === listingProductId
          ? resolution.sourceRecord?.model
          : undefined,
    },
  ].filter((entry) => !!entry.product);

  return (
    <Menu withinPortal position="bottom-end" shadow="sm" width={280}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <PiDotsThree size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {products.map(({ label, product }) => (
          <Menu.Item
            key={label}
            leftSection={<LuExternalLink size={14} />}
            component={Link}
            href={routes.products.details(product!.id)}
            target="_blank"
          >
            {label}: {product!.displayName}
          </Menu.Item>
        ))}

        {resolution.sourceRecord?.url && (
          <Menu.Item
            leftSection={<IoEye size={14} />}
            component="a"
            href={resolution.sourceRecord.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open the scraped listing
          </Menu.Item>
        )}

        <Menu.Divider />

        <CopyButton value={resolution.id}>
          {({ copied, copy }) => (
            <Menu.Item leftSection={<FaCopy size={14} />} onClick={copy}>
              {copied ? "Copied" : `ID: ${resolution.id}`}
            </Menu.Item>
          )}
        </CopyButton>

        {resolution.anchorKey && (
          <CopyButton value={resolution.anchorKey}>
            {({ copied, copy }) => (
              <Menu.Item leftSection={<FaCopy size={14} />} onClick={copy}>
                {copied ? "Copied" : `Anchor: ${resolution.anchorKey}`}
              </Menu.Item>
            )}
          </CopyButton>
        )}

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={<IoTrash size={14} />}
          onClick={onDelete}
        >
          Delete record
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
