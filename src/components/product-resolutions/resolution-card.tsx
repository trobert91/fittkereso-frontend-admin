"use client";

import { useMemo, useState } from "react";
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
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
import { FaCheck, FaCopy, FaHistory, FaTimes } from "react-icons/fa";
import { IoChevronDown, IoChevronUp, IoEye, IoTrash, IoWarning } from "react-icons/io5";
import { LuExternalLink } from "react-icons/lu";
import { MdRateReview } from "react-icons/md";
import { PiDotsThree, PiRobot } from "react-icons/pi";
import {
  deleteResolution,
  ProductResolutionRecord,
  ResolutionListItem,
} from "@/api-actions/product/product-resolutions";
import { ColoredBadge } from "@/components/colored-badge";
import { ProductModel } from "@/models/product-model";
import { formatDate } from "@/utils/date";
import { routes } from "@/utils/routes";
import { ResolutionActions } from "./resolution-actions";
import { ResolutionCandidatePanel } from "./resolution-candidate-panel";
import { EvidenceSection, ResolutionEvidence } from "./resolution-evidence";
import { ResolutionInputPanel } from "./resolution-input-panel";
import { ResolutionHistoryModal } from "./resolution-history-modal";
import { ResolutionPairStrip } from "./resolution-pair-strip";
import { ResolutionPriorityRing } from "./resolution-priority-ring";
import { ResolutionReviewModal } from "./resolution-review-modal";
import { ResolutionAiPanel } from "./resolution-ai-panel";
import { ResolutionAiReviewModal } from "./resolution-ai-review-modal";
import { ResolutionTriggerChips } from "./resolution-trigger-chips";
import {
  ACTION_KIND_LABELS,
  AI_CONFIDENCE_COLORS,
  AI_CONFIDENCE_LABELS,
  AI_VERDICT_LABELS,
  DECIDED_BY_COLORS,
  DECIDED_BY_LABELS,
  DECISION_KIND_COLORS,
  DECISION_KIND_LABELS,
  FLOW_COLORS,
  FLOW_LABELS,
  ORIGIN_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  VERDICT_COLORS,
  VERDICT_LABELS,
  decisionReasonLabel,
  failedGateCount,
  isDecisionReasonCode,
  productLookup,
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [justActed, setJustActed] = useState(false);

  const { resolution, state } = item;
  const statusColor = STATUS_COLORS[resolution.status] ?? "gray";
  const decisionCount = resolution.decisions?.length ?? 0;

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
              {/* The ordering key leads the card: it is the reason this row is
                  where it is on the page, and clicking it shows why. */}
              <ResolutionPriorityRing
                priority={resolution.priority}
                breakdown={resolution.priorityBreakdown}
              />

              <Badge color={statusColor} variant="light" size="sm" tt="none">
                {STATUS_LABELS[resolution.status]}
              </Badge>

              <Tooltip
                label="How alike the two things look. Not a measure of whether the decision was right — that is confidence."
                withArrow
                multiline
                maw={300}
              >
                <Badge color="gray" variant="light" size="sm" tt="none">
                  similarity: {resolution.similarityScore}
                </Badge>
              </Tooltip>

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
                <Tooltip
                  label="How sure we are the outcome was right — whichever outcome it was. A confident rejection scores high here, not zero."
                  withArrow
                  multiline
                  maw={300}
                >
                  <Box style={{ display: "inline-flex" }}>
                    <ColoredBadge
                      value={resolution.decisionConfidence}
                      label="confidence"
                    />
                  </Box>
                </Tooltip>
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

            <Group gap={4} wrap="nowrap">
              <Tooltip
                label={`Decision history — ${decisionCount} entr${decisionCount === 1 ? "y" : "ies"}`}
                withArrow
              >
                <Button
                  size="compact-xs"
                  variant="light"
                  color="gray"
                  leftSection={<FaHistory size={10} />}
                  onClick={() => setHistoryOpen(true)}
                  disabled={decisionCount === 0}
                >
                  history
                  {decisionCount > 1 ? ` (${decisionCount})` : ""}
                </Button>
              </Tooltip>

              <RowMenu
                resolution={resolution}
                listingProductId={state.listingProductId}
                onDelete={handleDelete}
              />
            </Group>
          </Group>
        </Card.Section>

        <Card.Section withBorder inheritPadding py="md">
          <VerdictLine item={item} />
        </Card.Section>

        {/* Leads the content: a wrong input is the most common cause of a wrong
            match, and it frames every candidate below it — so it sits above them
            rather than after, and never behind the expander. */}
        <Card.Section withBorder inheritPadding py="md">
          <EvidenceSection title="Inputs">
            <ResolutionInputPanel resolution={resolution} />
          </EvidenceSection>
        </Card.Section>

        {/* The candidates, in whichever shape the expander is in: a grid of
            tiles when closed, a row per candidate when open. One section rather
            than a strip plus a separate "Candidates considered" block, so
            expanding deepens the comparison instead of restating it. */}
        <Card.Section withBorder inheritPadding py="md">
          {resolution.flow === "duplicate_detection" ? (
            <ResolutionPairStrip
              resolution={resolution}
              showMergeDirection={!state.lastPerformed}
            />
          ) : (
            <ResolutionCandidatePanel
              resolution={resolution}
              listing={item.listing}
              candidateImageUrls={item.candidateImageUrls}
              expanded={expanded}
            />
          )}
        </Card.Section>

        {/* Above the fold, not behind the expander. An unapplied recommendation
            is a decision waiting to be made, which is what the rest of the
            closed card is for — and an executed one is the AI having closed the
            row on its own, which is exactly when its reasoning is worth reading
            without hunting through the history. The panel itself decides which
            of the two it is rendering. */}
        {resolution.aiReview && (
          <Card.Section withBorder inheritPadding py="md">
            <ResolutionAiPanel item={item} onUpdated={handleUpdated} />
          </Card.Section>
        )}

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
              <Tooltip
                label={
                  resolution.aiReviewedAt
                    ? "Ask the AI again — its previous verdict is replaced. You confirm first, and read the result before it closes."
                    : "Ask the AI to judge this row now, instead of waiting for the nightly batch. You confirm first, and read the result before it closes."
                }
                withArrow
                multiline
                maw={300}
              >
                <Button
                  size="compact-xs"
                  variant="light"
                  color="grape"
                  leftSection={<PiRobot size={12} />}
                  onClick={() => setAiReviewOpen(true)}
                >
                  {resolution.aiReviewedAt ? "Re-review with AI" : "Review with AI"}
                </Button>
              </Tooltip>
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

      <ResolutionHistoryModal
        resolution={resolution}
        opened={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      {/* The AI verdict is not a decision the reviewer made, so it does not get
          the "just decided" marker — it either changed the row, in which case
          the refreshed status says so, or it left advice, in which case the row
          is still theirs to settle. */}
      <ResolutionAiReviewModal
        resolution={resolution}
        opened={aiReviewOpen}
        onClose={() => setAiReviewOpen(false)}
        onUpdated={onUpdated}
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

/**
 * What the system concluded, and what a human has done since.
 *
 * Badge-led rather than prose: the three things a reviewer scans for — which
 * way it went, which product it landed on, and which stage decided — are fixed
 * in position and colour, so a queue of these can be read down the page instead
 * of sentence by sentence. Only genuinely free-form text (an LLM's written
 * reasoning) stays as a paragraph; the pipeline's own reason codes become
 * badges, since `matcher_accept` is a label, not a sentence.
 */
function VerdictLine({ item }: { item: ResolutionListItem }) {
  const [expanded, setExpanded] = useState(false);
  const { resolution, state } = item;

  const seed = systemDecision(resolution);
  const performed = state.lastPerformed;
  const snapshot = resolution.decisionSnapshot;
  const products = useMemo(() => productLookup(resolution), [resolution]);

  const outcome = useMemo(() => {
    switch (seed?.verdict) {
      case "matched_existing":
        return (
          <>
            <Text size="sm" c="dimmed">
              this listing →
            </Text>
            <ProductRef
              product={
                products[seed.action.productId ?? ""] ??
                resolution.resolvedProduct
              }
            />
          </>
        );
      case "created_new":
        return (
          <Text size="sm">
            nothing matched, so{" "}
            <ProductRef
              product={
                products[seed.action.productId ?? ""] ??
                resolution.resolvedProduct
              }
              fallback="a new product"
              span
            />{" "}
            was created
          </Text>
        );
      case "duplicate_proposed":
        return (
          <>
            <ProductRef product={resolution.productA} fallback="one product" />
            <Text size="sm" c="dimmed">
              ⇄
            </Text>
            <ProductRef product={resolution.productB} fallback="another" />
            <Badge color="gray" variant="outline" size="sm" tt="none">
              nothing merged yet
            </Badge>
          </>
        );
      default:
        return (
          <Text size="sm" c="dimmed">
            no system verdict was recorded for this row
          </Text>
        );
    }
  }, [seed, products, resolution]);

  // The correction on offer is derived from the last *performed* action, so
  // saying what that was is what makes the available buttons make sense.
  const since =
    performed && performed.actor === "admin"
      ? `You ${performed.verdict === "accept" ? "accepted" : "declined"} this on ${formatDate(performed.at, "yyyy-MM-dd")} — ${ACTION_KIND_LABELS[performed.action.kind]}.`
      : undefined;

  const reason = snapshot?.reason;
  // A reason code says the same thing a badge says, only in pipeline spelling.
  // Prose — which only the LLM strategies write — is the case worth reading.
  const prose = reason && !isDecisionReasonCode(reason) ? reason : undefined;
  const truncatable = !!prose && prose.length > REASON_TRUNCATE_LIMIT;

  return (
    <Stack gap={6}>
      <Group gap="xs" wrap="wrap" align="center">
        <Badge
          color="violet"
          variant="light"
          size="sm"
          tt="none"
          leftSection={<PiRobot size={10} />}
        >
          system
        </Badge>

        {seed && (
          <Badge
            color={VERDICT_COLORS[seed.verdict]}
            variant="filled"
            size="sm"
            tt="none"
          >
            {VERDICT_LABELS[seed.verdict]}
          </Badge>
        )}

        {outcome}

        {snapshot && (
          <Tooltip
            label={
              snapshot.evidenceSummary ??
              "Which stage produced this verdict — the matcher's own scoring, or the LLM adjudicating what the matcher would not accept."
            }
            withArrow
            multiline
            maw={340}
          >
            <Badge
              color={DECISION_KIND_COLORS[snapshot.kind]}
              variant="light"
              size="sm"
              tt="none"
            >
              {DECISION_KIND_LABELS[snapshot.kind]}
              {snapshot.confidence > 0
                ? ` · ${Math.round(snapshot.confidence)}`
                : ""}
            </Badge>
          </Tooltip>
        )}

        {reason && !prose && (
          <Tooltip label={reason} withArrow>
            <Badge color="gray" variant="outline" size="sm" tt="none">
              {decisionReasonLabel(reason)}
            </Badge>
          </Tooltip>
        )}

        {/* Who settled it, when that was not a human. The automation audit,
            visible on the row rather than only in a filter. */}
        {resolution.decidedBy && resolution.decidedBy !== "admin" && (
          <Badge
            color={DECIDED_BY_COLORS[resolution.decidedBy]}
            variant="filled"
            size="sm"
            tt="none"
          >
            {DECIDED_BY_LABELS[resolution.decidedBy]}
          </Badge>
        )}

        {resolution.aiConfidence && (
          <Tooltip
            label={
              resolution.aiReview
                ? `${AI_VERDICT_LABELS[resolution.aiReview.verdict]} — ${resolution.aiReview.reasoning}`
                : "The AI reviewer's own confidence in its verdict."
            }
            withArrow
            multiline
            maw={360}
          >
            <Badge
              color={AI_CONFIDENCE_COLORS[resolution.aiConfidence]}
              variant="light"
              size="sm"
              tt="none"
              leftSection={<PiRobot size={10} />}
            >
              {AI_CONFIDENCE_LABELS[resolution.aiConfidence]}
            </Badge>
          </Tooltip>
        )}
      </Group>

      {/* Why this row might be wrong. Sits on its own line under the verdict
          strip: these are the reasons to look, and they should not compete for
          space with what the system concluded. */}
      <Group gap="xs" wrap="wrap" align="center">
        <ResolutionTriggerChips triggers={resolution.reviewTriggers} />
      </Group>

      {since && (
        <Text size="sm" c="dimmed">
          {since}
        </Text>
      )}

      {prose && (
        <Text size="xs" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
          {truncatable && !expanded
            ? `${prose.slice(0, REASON_TRUNCATE_LIMIT)}… `
            : `${prose} `}
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

/** The product a verdict landed on. It is the thing a reviewer scans the row
 *  for, so it carries weight and links out rather than sitting inside a
 *  sentence at body weight. */
function ProductRef({
  product,
  fallback = "a product",
  span,
}: {
  product?: ProductModel;
  fallback?: string;
  span?: boolean;
}) {
  if (!product) {
    return (
      <Text span={span} size="sm" fw={600} c="dimmed">
        {fallback}
      </Text>
    );
  }

  return (
    <Anchor
      component={Link}
      href={routes.products.details(product.id)}
      target="_blank"
      size="sm"
      fw={600}
    >
      {product.displayName}
    </Anchor>
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
