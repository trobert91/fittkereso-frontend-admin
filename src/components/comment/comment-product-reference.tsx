import {
  ProductReference,
  ProductReferenceUpdatePayload,
} from "@/models/product-reference";
import {
  getPrimaryCandidate,
  getPrimaryModel,
} from "@/models/product-reference-helpers";
import { Evidence } from "@/models/thread-extraction-models";
import { FeatureLabelConfig } from "@/models/product-category";
import { EvidenceBadge } from "@/components/evidence-badge";
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  CopyButton,
  Group,
  Menu,
  Modal,
  Popover,
  SegmentedControl,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { ProductReferenceTabs } from "./product-reference-tabs";
import { ContextModal } from "./context-modal";
import { SearchContextModal } from "./search-context-modal";
import { CommentReviewModal } from "./comment-review-modal";

import { ProductReferenceCandidateStrip } from "./product-reference-candidate-strip";
import {
  ProductReferenceCandidatesEditor,
  CandidateDraft,
} from "./product-reference-candidates-editor";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import { useCategoryDetails } from "@/hooks/useCategoryDetails";
import {
  changeProductReference,
  selectCategories,
} from "@/store/slices/comment-slice";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaTimes,
  FaCopy,
  FaEye,
  FaPen,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { MdRateReview } from "react-icons/md";
import { PiDotsThree } from "react-icons/pi";
import { IoAlert } from "react-icons/io5";
import { IoMdAlert } from "react-icons/io";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";
import { ColoredBadge } from "../colored-badge";
import { ScoreRing } from "../score-ring";
import { ValidationIssuesModal } from "./validation-issues-modal";
import {
  IssueFieldAlert,
  unresolvedIssuesForField,
} from "./issue-field-alert";
import { sentimentLabel } from "@/components/sentiment-badge";
import {
  Depth,
  ExperienceType,
  Intent,
  Sentiment,
} from "@/models/enums/review-enums";
import { StructuredSpec } from "@/models/product-specs";

const SENTIMENT_COLORS: Record<string, string> = {
  strongPositive: "green",
  positive: "green",
  neutral: "gray",
  negative: "red",
  strongNegative: "red",
  mixed: "blue",
};

function sentimentBadgeColor(sentiment: string): string {
  switch (sentiment) {
    case "strongPositive":
      return "green.7";
    case "positive":
      return "green";
    case "negative":
      return "orange";
    case "strongNegative":
      return "red";
    default:
      return "gray";
  }
}

function experienceBadgeColor(experience: string): string {
  switch (experience) {
    case "owner":
      return "green.7";
    case "prior_owner":
      return "green";
    case "prospective_buyer":
      return "orange";
    case "reference":
      return "red";
    default:
      return "gray";
  }
}

function depthBadgeColor(depth: string): string {
  switch (depth) {
    case "comprehensive":
      return "green.7";
    case "detailed":
      return "green";
    case "mentioned":
      return "orange";
    case "superficial":
      return "red";
    default:
      return "gray";
  }
}

function intentBadgeColor(intent: string): string {
  switch (intent) {
    case "recommendation":
      return "green.7";
    case "experience_report":
      return "green";
    case "issue_report":
    case "warning":
      return "orange";
    case "seeking_advice":
    case "question":
      return "red";
    default:
      return "gray";
  }
}

const humanizeSentiment = (s: Sentiment): string => {
  switch (s) {
    case Sentiment.StrongPositive:
      return "strong +";
    case Sentiment.Positive:
      return "positive";
    case Sentiment.Neutral:
      return "neutral";
    case Sentiment.Negative:
      return "negative";
    case Sentiment.StrongNegative:
      return "strong -";
    case Sentiment.Mixed:
      return "mixed";
  }
};

export const CommentTableProductReferenceItem = ({
  commentId,
  commentBody,
  productRef,
  statusColor,
  onChangeProductReference,
}: {
  commentId: string;
  commentBody?: string;
  productRef: ProductReference;
  statusColor: string;
  onChangeProductReference?: (payload: {
    commentId: string;
    productReference: ProductReferenceUpdatePayload;
  }) => void;
}) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const [reviewModalOpened, setReviewModalOpened] = useState(false);
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [searchContextModalOpen, setSearchContextModalOpen] = useState(false);
  const [editFieldsModalOpen, setEditFieldsModalOpen] = useState(false);

  // Single source of truth for "the resolved product" — the primary candidate's
  // model, mirroring backend's getPrimaryModel helper. Memoized so per-render
  // derivations don't churn when the reference object is the same reference.
  const primaryCandidate = useMemo(
    () => getPrimaryCandidate(productRef),
    [productRef],
  );
  const resolvedModel = useMemo(
    () => getPrimaryModel(productRef),
    [productRef],
  );
  const primaryReview = primaryCandidate?.review ?? null;
  const runnerUpCount = Math.max((productRef.candidates?.length ?? 0) - 1, 0);

  // Web search ran during this resolution. Surface as a red badge so reviewers
  // can spot SERP-driven resolutions at a glance, matching the deterministic
  // `resolved_via_web_search` validation issue's logic.
  const webSearchRan =
    productRef.searchContext?.strategiesRun?.includes("web") ?? false;

  // Unresolved product-scoped issues, surfaced as a single red badge in the
  // relevance/enum row (replaces the per-spec inline alert icon that used to
  // live in row 1).
  const unresolvedProductIssues = useMemo(
    () => unresolvedIssuesForField(productRef.context?.issues, "product"),
    [productRef.context?.issues],
  );

  const categoryId =
    resolvedModel?.productCategory?.id ??
    productRef.context?.resolution?.preResolvedCategories?.[0]?.id;

  const category = useMemo(() => {
    if (!categoryId) return undefined;
    return categories.find((c) => c.id === categoryId);
  }, [categoryId, categories]);

  const availableUseCases = useMemo(
    () => category?.config?.useCases?.map((u) => u.label) ?? [],
    [category],
  );

  const availableFeatures = useMemo(
    () => category?.config?.features ?? [],
    [category],
  );

  const onChange = useCallback(
    (partial: Omit<ProductReferenceUpdatePayload, "id">) => {
      const payload = {
        commentId,
        productReference: {
          ...partial,
          id: productRef.id,
        },
      };
      if (onChangeProductReference) {
        onChangeProductReference(payload);
      } else {
        dispatch(changeProductReference(payload));
      }
    },
    [dispatch, commentId, productRef.id, onChangeProductReference],
  );

  const productDisplayName =
    resolvedModel?.displayName ??
    resolvedModel?.model ??
    productRef.context?.identification?.displayName ??
    productRef.context?.identification?.model ??
    "unresolved";

  const sentimentBadgeFill =
    SENTIMENT_COLORS[productRef.sentiment ?? ""] ?? "gray";

  return (
    <>
      {productRef.reviewComment && (
        <Box mb="xs">
          <Box
            style={{
              borderLeft: "4px solid var(--mantine-color-yellow-6)",
              borderRadius: "var(--mantine-radius-sm)",
              background: "var(--mantine-color-yellow-light)",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <IoMdAlert size={14} color="var(--mantine-color-yellow-7)" />
            <Text size="sm">{productRef.reviewComment}</Text>
          </Box>
        </Box>
      )}

      <Box
        p="sm"
        style={{
          border: `1px solid var(--mantine-color-${sentimentBadgeFill}-8)`,
          borderRadius: "var(--mantine-radius-sm)",
          background: "var(--mantine-color-dark-7)",
          opacity: productRef.enabled ? 1 : 0.6,
        }}
      >
        {/* Two-column layout: candidates on the left, metadata + quotes on
            the right. The right column carries the legacy three-row metadata
            stack (specs, enum/labels/relevance, actions) followed by the
            quotes/labelling tabs — so a vertical eye-trace on the right reads
            metadata → quotes while candidates sit to the side. */}
        <Group align="flex-start" wrap="nowrap" gap="md">
          <Box style={{ flexShrink: 0 }}>
            <ProductReferenceCandidateStrip
              candidates={productRef.candidates}
              fallbackName={productDisplayName}
            />
          </Box>

          <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
            <Stack gap="sm">
              {/* row 1: extracted specs + ambiguous flag + web search flag */}
              {((productRef.specs?.length ?? 0) > 0 ||
                (productRef.ambiguousResolution && runnerUpCount > 0) ||
                webSearchRan) && (
                <Group gap="xs" wrap="wrap" align="center">
                  {productRef.ambiguousResolution && runnerUpCount > 0 && (
                    <Tooltip
                      label={`Ambiguous resolution — ${runnerUpCount} runner-up candidate${runnerUpCount === 1 ? "" : "s"} sharing the vote.`}
                      withArrow
                    >
                      <Badge
                        color="orange"
                        variant="light"
                        size="md"
                        tt="none"
                        radius="sm"
                      >
                        ambiguous (+{runnerUpCount})
                      </Badge>
                    </Tooltip>
                  )}
                  {webSearchRan && (
                    <Tooltip
                      label="Web search ran during this resolution (SERP-driven recall)."
                      withArrow
                    >
                      <Badge
                        color="red"
                        variant="light"
                        size="md"
                        tt="none"
                        radius="sm"
                      >
                        web search
                      </Badge>
                    </Tooltip>
                  )}
                  {productRef.specs?.map((spec, i) => (
                    <Badge
                      key={`spec-${i}`}
                      color="blue"
                      variant="light"
                      size="md"
                      tt="none"
                      radius="sm"
                    >
                      {spec.name}: {spec.value}
                    </Badge>
                  ))}
                </Group>
              )}

              {/* row 2: relevance/weight/review/enums/use-cases/features/validation */}
              <Group gap="sm" wrap="wrap" align="center">
            <ScoreRing
              rate={productRef.relevance ?? 0}
              size={28}
              thickness={3}
              tooltip={`relevance: ${productRef.relevance ?? 0}`}
            />

            {primaryCandidate?.weight != null &&
              productRef.candidates &&
              productRef.candidates.length > 1 && (
                <Tooltip
                  label="Primary candidate weight (softmax over the candidate set)."
                  withArrow
                >
                  <ColoredBadge
                    value={Math.round(primaryCandidate.weight * 100)}
                    label="weight"
                  />
                </Tooltip>
              )}

            {unresolvedProductIssues.length > 0 && (
              <Tooltip
                label={unresolvedProductIssues
                  .map((issue) => {
                    const reasoning = issue.reasoning
                      ? ` — ${issue.reasoning}`
                      : "";
                    return `${issue.type.split("_").join(" ")}${reasoning}`;
                  })
                  .join("\n")}
                withArrow
                multiline
                maw={400}
              >
                <Badge
                  color="red"
                  variant="light"
                  size="md"
                  tt="none"
                  radius="sm"
                  leftSection={<IoMdAlert size={10} />}
                >
                  {unresolvedProductIssues.length} product issue
                  {unresolvedProductIssues.length === 1 ? "" : "s"}
                </Badge>
              </Tooltip>
            )}

            {primaryReview && (
              <Badge
                color="gray"
                variant="light"
                size="md"
                tt="none"
                radius="sm"
                style={{ cursor: "pointer" }}
                leftSection={<MdRateReview size={12} />}
                onClick={() => setReviewModalOpened(true)}
              >
                review
              </Badge>
            )}

            {/* enum strip — display only, edited via modal */}
            <Group gap={0}>
              {productRef.sentiment && (
                <Badge
                  color={sentimentBadgeColor(productRef.sentiment)}
                  variant="light"
                  size="md"
                  tt="none"
                  radius={0}
                  rightSection={
                    <IssueFieldAlert
                      issues={productRef.context?.issues}
                      field="sentiment"
                    />
                  }
                >
                  {sentimentLabel(productRef.sentiment)}
                </Badge>
              )}
              {productRef.experience && (
                <Badge
                  color={experienceBadgeColor(productRef.experience)}
                  variant="light"
                  size="md"
                  tt="none"
                  radius={0}
                  rightSection={
                    <IssueFieldAlert
                      issues={productRef.context?.issues}
                      field="experience"
                    />
                  }
                >
                  {productRef.experience.split("_").join(" ")}
                </Badge>
              )}
              {productRef.depth && (
                <Badge
                  color={depthBadgeColor(productRef.depth)}
                  variant="light"
                  size="md"
                  tt="none"
                  radius={0}
                  rightSection={
                    <IssueFieldAlert
                      issues={productRef.context?.issues}
                      field="depth"
                    />
                  }
                >
                  {productRef.depth}
                </Badge>
              )}
              {productRef.intents?.map((intent, i) => (
                <Badge
                  key={`intent-${i}`}
                  color={intentBadgeColor(intent)}
                  variant="light"
                  size="md"
                  tt="none"
                  radius={0}
                  rightSection={
                    i === 0 ? (
                      <IssueFieldAlert
                        issues={productRef.context?.issues}
                        field="intent"
                      />
                    ) : undefined
                  }
                >
                  {intent.split("_").join(" ")}
                </Badge>
              ))}
            </Group>

            {productRef.useCases?.map((uc, i) => (
              <EvidenceBadge key={`uc-${i}`} value={uc} kind="useCase" />
            ))}

            {productRef.features?.map((f, i) => (
              <EvidenceBadge key={`f-${i}`} value={f} kind="feature" />
            ))}

            <Tooltip label="edit fields" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={() => setEditFieldsModalOpen(true)}
              >
                <FaPen size={12} />
              </ActionIcon>
            </Tooltip>

            {(productRef.context?.issues?.length ?? 0) > 0 && (
              <ValidationIssuesModal
                issuesWithSource={productRef.context.issues!.map((issue) => ({
                  issue,
                  sourceLabel:
                    resolvedModel?.displayName ??
                    resolvedModel?.model ??
                    productRef.context?.identification?.displayName ??
                    productRef.context?.identification?.model ??
                    `ref ${productRef.id.slice(0, 6)}`,
                  sourceColor: sentimentBadgeFill,
                }))}
                issueSeverity={productRef.issueSeverity}
                openIssueSeverity={productRef.openIssueSeverity}
              />
            )}
              </Group>

              {/* action row */}
              <Group gap="sm">
            <Button
              size="compact-xs"
              variant={productRef.enabled ? "filled" : "outline"}
              color={productRef.enabled ? statusColor : "red"}
              onClick={() => onChange({ enabled: !productRef.enabled })}
              leftSection={
                productRef.enabled ? (
                  <FaCheck size={10} />
                ) : (
                  <FaTimes size={10} />
                )
              }
            >
              {productRef.enabled ? "enabled" : "disabled"}
            </Button>
            <Button
              size="compact-xs"
              variant={productRef.flagged ? "filled" : "outline"}
              color={productRef.flagged ? "red" : "gray"}
              onClick={() => onChange({ flagged: !productRef.flagged })}
              leftSection={
                productRef.flagged ? (
                  <IoAlert size={10} />
                ) : (
                  <FaCheck size={10} />
                )
              }
            >
              {productRef.flagged ? "flagged" : "unflagged"}
            </Button>
            <Button
              size="compact-xs"
              variant="light"
              color="gray"
              leftSection={<FaEye size={10} />}
              onClick={() => setContextModalOpen(true)}
            >
              context
            </Button>
            {productRef.searchContext && (
              <Button
                size="compact-xs"
                variant="light"
                color="gray"
                leftSection={<FaEye size={10} />}
                onClick={() => setSearchContextModalOpen(true)}
              >
                search context
              </Button>
            )}
            {resolvedModel?.id && (
              <Anchor
                component={Link}
                href={routes.products.details(resolvedModel.id)}
                target="_blank"
              >
                <Button
                  size="compact-xs"
                  variant="light"
                  color="gray"
                  leftSection={<LuExternalLink size={10} />}
                >
                  product
                </Button>
              </Anchor>
            )}
            <Menu shadow="sm" width={250}>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <PiDotsThree size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <CopyButton value={productRef.id}>
                  {({ copied, copy }) => (
                    <Menu.Item
                      leftSection={<FaCopy size={12} />}
                      onClick={copy}
                    >
                      {copied ? "Copied" : `ID: ${productRef.id}`}
                    </Menu.Item>
                  )}
                </CopyButton>
              </Menu.Dropdown>
            </Menu>
              </Group>
            </Stack>

            <ProductReferenceTabs
              commentId={commentId}
              commentBody={commentBody}
              productRef={productRef}
              categoryId={categoryId}
              availableUseCases={availableUseCases}
              availableFeatures={availableFeatures}
              onChangeProductReference={onChangeProductReference}
            />
          </Stack>
        </Group>
      </Box>

      <ProductReferenceEditModal
        opened={editFieldsModalOpen}
        onClose={() => setEditFieldsModalOpen(false)}
        productRef={productRef}
        categoryId={categoryId}
        availableFeatures={availableFeatures}
        availableUseCases={availableUseCases}
        onSave={(partial) => {
          onChange(partial);
          setEditFieldsModalOpen(false);
        }}
      />

      {primaryReview && (
        <CommentReviewModal
          reviewId={primaryReview.id}
          opened={reviewModalOpened}
          onClose={() => setReviewModalOpened(false)}
        />
      )}

      {productRef.context && (
        <ContextModal
          opened={contextModalOpen}
          onClose={() => setContextModalOpen(false)}
          context={productRef.context}
        />
      )}

      {productRef.searchContext && (
        <SearchContextModal
          opened={searchContextModalOpen}
          onClose={() => setSearchContextModalOpen(false)}
          searchContext={productRef.searchContext}
        />
      )}
    </>
  );
};

/**
 * Snapshot the persisted candidate set into editor draft rows. Confidence and
 * isPrimary are carried verbatim; weight is dropped because the backend
 * recomputes it on save via softmax. Synthetic ids guarantee stable React
 * keys even when the underlying candidate has no persisted id yet
 * (optimistic-* placeholders from `onSelectProduct`).
 */
function snapshotCandidates(ref: ProductReference): CandidateDraft[] {
  return (ref.candidates ?? [])
    .filter((candidate) => candidate.model != null)
    .map((candidate) => ({
      id: candidate.id || `draft-${candidate.model.id}`,
      model: candidate.model,
      confidence: candidate.confidence ?? 0,
      isPrimary: candidate.isPrimary,
    }));
}

const ProductReferenceEditModal = ({
  opened,
  onClose,
  onSave,
  productRef,
  categoryId,
  availableFeatures,
  availableUseCases,
}: {
  opened: boolean;
  onClose: () => void;
  onSave: (partial: Omit<ProductReferenceUpdatePayload, "id">) => void;
  productRef: ProductReference;
  categoryId?: string;
  availableFeatures: FeatureLabelConfig[];
  availableUseCases: string[];
}) => {
  // Fetch full category config on open — the comment-table prefetches the top
  // 50 categories, but a comment whose category isn't in that set would leave
  // availableFeatures/availableUseCases empty and the Selects would have no
  // data. useCategoryDetails dedupes and skips when fresh.
  const { details: fetchedCategory } = useCategoryDetails(categoryId, {
    enabled: opened,
  });
  const fetchedConfig = fetchedCategory?.config;
  const resolvedFeatures: FeatureLabelConfig[] =
    fetchedConfig?.features ?? availableFeatures;
  const resolvedFeatureLabels = resolvedFeatures.map((f) => f.label);
  const resolvedUseCases =
    fetchedConfig?.useCases?.map((u) => u.label) ?? availableUseCases;
  const [sentiment, setSentiment] = useState<Sentiment | "">(
    productRef.sentiment ?? "",
  );
  const [experience, setExperience] = useState<ExperienceType | "">(
    productRef.experience ?? "",
  );
  const [depth, setDepth] = useState<Depth | "">(productRef.depth ?? "");
  const [intents, setIntents] = useState<Intent[]>(productRef.intents ?? []);
  const [specs, setSpecs] = useState<StructuredSpec[]>(productRef.specs ?? []);
  const [refFeatures, setRefFeatures] = useState<Evidence[]>(
    productRef.features ?? [],
  );
  const [refUseCases, setRefUseCases] = useState<Evidence[]>(
    productRef.useCases ?? [],
  );
  const [candidateDrafts, setCandidateDrafts] = useState<CandidateDraft[]>(
    () => snapshotCandidates(productRef),
  );

  useEffect(() => {
    if (!opened) return;
    setSentiment(productRef.sentiment ?? "");
    setExperience(productRef.experience ?? "");
    setDepth(productRef.depth ?? "");
    setIntents(productRef.intents ?? []);
    setSpecs(productRef.specs ?? []);
    setRefFeatures(productRef.features ?? []);
    setRefUseCases(productRef.useCases ?? []);
    setCandidateDrafts(snapshotCandidates(productRef));
  }, [opened, productRef]);

  const updateSpec = (index: number, partial: Partial<StructuredSpec>) => {
    setSpecs((prev) =>
      prev.map((spec, i) => (i === index ? { ...spec, ...partial } : spec)),
    );
  };

  const removeSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const addSpec = () => {
    setSpecs((prev) => [...prev, { name: "", value: "" }]);
  };

  const submit = () => {
    const cleanedSpecs = specs
      .map((s) => ({ name: s.name.trim(), value: s.value.trim() }))
      .filter((s) => s.name.length > 0 || s.value.length > 0);

    // Drop entries with no label; strip issueType (invariant: ref-level
    // evidence cannot carry issueType — that's a per-quote concept).
    const cleanedRefFeatures = refFeatures
      .map((e) => ({ label: e.label.trim(), sentiment: e.sentiment }))
      .filter((e) => e.label.length > 0);
    const cleanedRefUseCases = refUseCases
      .map((e) => ({ label: e.label.trim(), sentiment: e.sentiment }))
      .filter((e) => e.label.length > 0);

    // Convert editor drafts back into rich candidate objects for the slice's
    // optimistic state. The wire mapper (`mapReferenceToDto`) flattens them
    // to `{ modelId, confidence, isPrimary }` at save time; the backend
    // re-derives weights via softmax. The synthetic `weight` here is purely
    // cosmetic until the server response replaces the optimistic set.
    const nowIso = new Date().toISOString();
    const candidatesForSlice = candidateDrafts.map((draft) => ({
      id: draft.id,
      createdAt: nowIso,
      updatedAt: nowIso,
      model: draft.model,
      confidence: draft.confidence,
      isPrimary: draft.isPrimary,
      weight: 1 / Math.max(candidateDrafts.length, 1),
    }));

    onSave({
      sentiment: sentiment === "" ? undefined : (sentiment as Sentiment),
      experience:
        experience === "" ? undefined : (experience as ExperienceType),
      depth: depth === "" ? undefined : (depth as Depth),
      intents: intents.length > 0 ? intents : undefined,
      specs: cleanedSpecs.length > 0 ? cleanedSpecs : null,
      features: cleanedRefFeatures.length > 0 ? cleanedRefFeatures : null,
      useCases: cleanedRefUseCases.length > 0 ? cleanedRefUseCases : null,
      candidates: candidatesForSlice,
      ambiguousResolution: candidatesForSlice.length > 1,
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit product reference"
      size="90%"
      centered
    >
      <Stack gap="md">
        <ProductReferenceCandidatesEditor
          candidates={candidateDrafts}
          onChange={setCandidateDrafts}
        />

        <Box>
          <Text size="sm" fw={500} mb={4}>
            sentiment
          </Text>
          <SegmentedControl
            data={Object.values(Sentiment).map((s) => ({
              value: s,
              label: humanizeSentiment(s),
            }))}
            value={sentiment}
            onChange={(val) => setSentiment(val as Sentiment)}
            size="xs"
            fullWidth
            color={sentiment ? sentimentBadgeColor(sentiment) : "gray"}
          />
        </Box>

        <Box>
          <Text size="sm" fw={500} mb={4}>
            experience
          </Text>
          <SegmentedControl
            data={Object.values(ExperienceType).map((e) => ({
              value: e,
              label: e.split("_").join(" ").toLowerCase(),
            }))}
            value={experience}
            onChange={(val) => setExperience(val as ExperienceType)}
            size="xs"
            fullWidth
            color={experience ? experienceBadgeColor(experience) : "gray"}
          />
        </Box>

        <Box>
          <Text size="sm" fw={500} mb={4}>
            depth
          </Text>
          <SegmentedControl
            data={Object.values(Depth).map((d) => ({
              value: d,
              label: d.toLowerCase(),
            }))}
            value={depth}
            onChange={(val) => setDepth(val as Depth)}
            size="xs"
            fullWidth
            color={depth ? depthBadgeColor(depth) : "gray"}
          />
        </Box>

        <TagsInput
          label="intents"
          data={Object.values(Intent)}
          value={intents}
          onChange={(values) => setIntents(values as Intent[])}
          placeholder="add intent"
          clearable
        />

        <EvidenceListEditor
          title="reference-level features"
          emptyHint="no reference-level features"
          entries={refFeatures}
          onChange={setRefFeatures}
          labelOptions={resolvedFeatureLabels}
          placeholder="feature"
          addButtonLabel="add feature"
        />

        <EvidenceListEditor
          title="reference-level use cases"
          emptyHint="no reference-level use cases"
          entries={refUseCases}
          onChange={setRefUseCases}
          labelOptions={resolvedUseCases}
          placeholder="use case"
          addButtonLabel="add use case"
        />

        <Box>
          <Text size="sm" fw={500} mb={4}>
            extracted specs
          </Text>
          <Stack gap="xs">
            {specs.length === 0 && (
              <Text size="xs" c="dimmed">
                no specs
              </Text>
            )}
            {specs.map((spec, i) => (
              <Group key={i} gap="xs" wrap="nowrap">
                <TextInput
                  placeholder="name"
                  value={spec.name}
                  onChange={(e) =>
                    updateSpec(i, { name: e.currentTarget.value })
                  }
                  size="xs"
                  style={{ flex: 1 }}
                />
                <TextInput
                  placeholder="value"
                  value={spec.value}
                  onChange={(e) =>
                    updateSpec(i, { value: e.currentTarget.value })
                  }
                  size="xs"
                  style={{ flex: 1 }}
                />
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={() => removeSpec(i)}
                  aria-label="remove spec"
                >
                  <FaTrash size={10} />
                </ActionIcon>
              </Group>
            ))}
            <Button
              size="compact-xs"
              variant="light"
              color="gray"
              leftSection={<FaPlus size={9} />}
              onClick={addSpec}
              style={{ alignSelf: "flex-start" }}
            >
              add spec
            </Button>
          </Stack>
        </Box>

        <Group justify="flex-end" gap="xs" mt="sm">
          <Button size="xs" variant="subtle" onClick={onClose}>
            cancel
          </Button>
          <Button size="xs" onClick={submit}>
            save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

/** Inline editor for a list of Evidence entries (label + sentiment) — mirrors
 *  the per-quote evidence editor in product-reference-tabs.tsx so admins get
 *  a consistent affordance across quote-level and ref-level evidence. Each
 *  entry: a searchable Select for the label (constrained to the category
 *  vocabulary), a SegmentedControl for sentiment, and a remove icon. An
 *  "add entry" button appends a new row with default sentiment Positive.
 *
 *  Ref-level evidence cannot carry `issueType` (invariant: issues are
 *  per-quote symptom reports — see comment-context.ts), so no issueType
 *  picker is rendered, regardless of sentiment. */
const EvidenceListEditor = ({
  title,
  emptyHint,
  entries,
  onChange,
  labelOptions,
  placeholder,
  addButtonLabel,
}: {
  title: string;
  emptyHint: string;
  entries: Evidence[];
  onChange: (next: Evidence[]) => void;
  labelOptions: string[];
  placeholder: string;
  addButtonLabel: string;
}) => {
  const update = (index: number, partial: Partial<Evidence>) => {
    onChange(entries.map((e, i) => (i === index ? { ...e, ...partial } : e)));
  };
  const remove = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };
  const add = () => {
    onChange([...entries, { label: "", sentiment: Sentiment.Positive }]);
  };

  return (
    <Box>
      <Text size="sm" fw={500} mb={4}>
        {title}
      </Text>
      <Stack gap="xs">
        {entries.length === 0 && (
          <Text size="xs" c="dimmed">
            {emptyHint}
          </Text>
        )}
        {entries.map((entry, i) => (
          <Group key={i} gap="xs" wrap="nowrap" align="center">
            <Select
              placeholder={placeholder}
              data={labelOptions}
              value={entry.label || null}
              onChange={(val) => update(i, { label: val ?? "" })}
              searchable
              size="xs"
              style={{ flex: 1 }}
            />
            <SegmentedControl
              data={Object.values(Sentiment).map((s) => ({
                value: s,
                label: humanizeSentiment(s),
              }))}
              value={entry.sentiment ?? Sentiment.Positive}
              onChange={(val) => update(i, { sentiment: val as Sentiment })}
              size="xs"
              color={sentimentBadgeColor(entry.sentiment ?? Sentiment.Positive)}
            />
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={() => remove(i)}
              aria-label={`remove ${placeholder}`}
            >
              <FaTrash size={10} />
            </ActionIcon>
          </Group>
        ))}
        <Button
          size="compact-xs"
          variant="light"
          color="gray"
          leftSection={<FaPlus size={9} />}
          onClick={add}
          style={{ alignSelf: "flex-start" }}
        >
          {addButtonLabel}
        </Button>
      </Stack>
    </Box>
  );
};
