import { ProductReference } from "@/models/product-reference";
import {
  ContentQuality,
  Evidence,
  Quote,
} from "@/models/thread-extraction-models";
import { Sentiment } from "@/models/enums/review-enums";
import { FeatureLabelConfig } from "@/models/product-category";
import { EvidenceBadge } from "@/components/evidence-badge";
import { sentimentColor } from "@/components/sentiment-badge";
import { ReferenceDetailsBadges } from "./reference-details-badges";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Popover,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { FaPen, FaPlus, FaTrash } from "react-icons/fa";
import { IoAlertCircle } from "react-icons/io5";
import { useCallback, useEffect, useState } from "react";
import { changeProductReference } from "@/store/slices/comment-slice";
import { useAppDispatch } from "@/store/store-hooks";
import { useCategoryDetails } from "@/hooks/useCategoryDetails";

const SENTIMENT_COLORS: Record<Sentiment, string> = {
  [Sentiment.StrongPositive]: "green",
  [Sentiment.Positive]: "green",
  [Sentiment.Neutral]: "gray",
  [Sentiment.Negative]: "red",
  [Sentiment.StrongNegative]: "red",
  [Sentiment.Mixed]: "blue",
};

const QUALITY_BADGE: Record<
  ContentQuality,
  { color: string; label: string }
> = {
  high: {
    color: "green",
    label: "High quality — first-hand observation useful for buyers",
  },
  medium: {
    color: "yellow",
    label: "Medium quality — informational but not first-hand",
  },
  low: {
    color: "red",
    label: "Low quality — filtered from rating aggregation",
  },
};

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

const generateQuoteId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `quote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const ProductReferenceTabs = ({
  commentId,
  commentBody,
  productRef,
  categoryId,
  availableUseCases,
  availableFeatures,
  onChangeProductReference,
}: {
  commentId: string;
  commentBody?: string;
  productRef: ProductReference;
  categoryId?: string;
  availableUseCases: string[];
  availableFeatures: FeatureLabelConfig[];
  onChangeProductReference?: (payload: {
    commentId: string;
    productReference: Partial<ProductReference> & { id: string };
  }) => void;
}) => {
  const dispatch = useAppDispatch();
  const [addQuoteOpen, setAddQuoteOpen] = useState(false);

  const onChange = useCallback(
    (partial: Partial<ProductReference>) => {
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

  const updateQuote = useCallback(
    (index: number, partial: Partial<Quote>) => {
      const next = (productRef.quotes ?? []).map((q, i) =>
        i === index ? { ...q, ...partial } : q,
      );
      onChange({ quotes: next });
    },
    [productRef.quotes, onChange],
  );

  const addQuote = useCallback(
    (quote: Quote) => {
      onChange({ quotes: [...(productRef.quotes ?? []), quote] });
    },
    [productRef.quotes, onChange],
  );

  const deleteQuote = useCallback(
    (index: number) => {
      const next = (productRef.quotes ?? []).filter((_, i) => i !== index);
      onChange({ quotes: next });
    },
    [productRef.quotes, onChange],
  );

  return (
    <Stack gap="xs">
      {productRef.referenceDetails && (
        <Group gap={4}>
          <ReferenceDetailsBadges details={productRef.referenceDetails} />
        </Group>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
        {productRef.quotes?.map((quote, index) => (
          <QuoteCard
            key={quote.id ?? index}
            quote={quote}
            onChange={(partial) => updateQuote(index, partial)}
            onDelete={() => deleteQuote(index)}
            commentBody={commentBody}
            categoryId={categoryId}
            availableUseCases={availableUseCases}
            availableFeatures={availableFeatures}
          />
        ))}
        <Button
          variant="light"
          color="gray"
          leftSection={<FaPlus size={10} />}
          onClick={() => setAddQuoteOpen(true)}
          fullWidth
          styles={{ root: { height: "100%" } }}
        >
          add quote
        </Button>
      </SimpleGrid>

      <QuoteEditorModal
        opened={addQuoteOpen}
        onClose={() => setAddQuoteOpen(false)}
        commentBody={commentBody}
        categoryId={categoryId}
        availableUseCases={availableUseCases}
        availableFeatures={availableFeatures}
        onSave={(quote) => {
          addQuote(quote);
          setAddQuoteOpen(false);
        }}
      />
    </Stack>
  );
};

const QuoteCard = ({
  quote,
  onChange,
  onDelete,
  commentBody,
  categoryId,
  availableUseCases,
  availableFeatures,
}: {
  quote: Quote;
  onChange: (partial: Partial<Quote>) => void;
  onDelete: () => void;
  commentBody?: string;
  categoryId?: string;
  availableUseCases: string[];
  availableFeatures: FeatureLabelConfig[];
}) => {
  const [editOpen, setEditOpen] = useState(false);

  const sentimentColor = SENTIMENT_COLORS[quote.sentiment] ?? "gray";
  const qualityBadge = quote.quality ? QUALITY_BADGE[quote.quality] : undefined;
  const dimmed = quote.quality === "low" || quote.speculative === true;

  return (
    <Alert
      variant="light"
      color={sentimentColor}
      px="sm"
      py={4}
      style={{ opacity: dimmed ? 0.6 : 1, position: "relative" }}
    >
      <Box
        style={{
          position: "absolute",
          top: 4,
          right: 6,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {quote.speculative ? (
          <Tooltip
            label="speculative — hedged/hearsay/future-tense; excluded from rating"
            withArrow
          >
            <Box
              style={{ display: "flex", color: "var(--mantine-color-red-6)" }}
            >
              <IoAlertCircle size={16} />
            </Box>
          </Tooltip>
        ) : null}
        <Group gap={0} align="center">
          <Badge
            color={sentimentColor}
            variant="filled"
            size="xs"
            tt="none"
            radius={0}
          >
            {humanizeSentiment(quote.sentiment)}
          </Badge>
          {qualityBadge ? (
            <Tooltip label={qualityBadge.label} withArrow>
              <Badge
                color={qualityBadge.color}
                variant="light"
                size="xs"
                tt="lowercase"
                radius={0}
              >
                {quote.quality}
              </Badge>
            </Tooltip>
          ) : (
            <Badge color="gray" variant="light" size="xs" tt="lowercase" radius={0}>
              quality
            </Badge>
          )}
          <Tooltip label="edit quote" withArrow>
            <Badge
              color="gray"
              variant="light"
              size="xs"
              radius={0}
              style={{ cursor: "pointer", padding: "0 6px" }}
              onClick={() => setEditOpen(true)}
            >
              <FaPen size={8} />
            </Badge>
          </Tooltip>
        </Group>
      </Box>
      <Text size="sm" pr={110} style={{ userSelect: "text" }}>
        {quote.text}
      </Text>

      <QuoteEditorModal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        quote={quote}
        commentBody={commentBody}
        categoryId={categoryId}
        availableUseCases={availableUseCases}
        availableFeatures={availableFeatures}
        onSave={(next) => {
          onChange(next);
          setEditOpen(false);
        }}
        onDelete={() => {
          onDelete();
          setEditOpen(false);
        }}
      />
      {quote.features?.length || quote.useCases?.length || quote.issues?.length ? (
        <Group gap={4} mt={4} align="center">
          {quote.useCases?.map((uc, i) => (
            <EvidenceBadge
              key={`uc-${i}`}
              value={uc}
              quote={quote}
              kind="useCase"
            />
          ))}
          {quote.features?.map((f, i) => (
            <EvidenceBadge
              key={`f-${i}`}
              value={f}
              quote={quote}
              kind="feature"
            />
          ))}
          {quote.issues?.map((iss, i) => (
            <EvidenceBadge
              key={`iss-${i}`}
              value={iss}
              quote={quote}
              kind="issue"
            />
          ))}
        </Group>
      ) : null}
    </Alert>
  );
};

const normalizeForMatch = (s: string): string =>
  s.toLowerCase().replace(/\s+/g, " ").trim();

const QuoteEditorModal = ({
  opened,
  onClose,
  onSave,
  onDelete,
  quote,
  commentBody,
  categoryId,
  availableUseCases,
  availableFeatures,
}: {
  opened: boolean;
  onClose: () => void;
  onSave: (quote: Quote) => void;
  onDelete?: () => void;
  quote?: Quote;
  commentBody?: string;
  categoryId?: string;
  availableUseCases: string[];
  availableFeatures: FeatureLabelConfig[];
}) => {
  const isEdit = quote != null;
  const { details: fetchedCategory } = useCategoryDetails(categoryId, {
    enabled: opened,
  });
  const fetchedConfig = fetchedCategory?.config;
  const resolvedUseCases =
    fetchedConfig?.useCases?.map((u) => u.label) ?? availableUseCases;
  const resolvedFeatures: FeatureLabelConfig[] =
    fetchedConfig?.features ?? availableFeatures;
  const resolvedFeatureLabels = resolvedFeatures.map((f) => f.label);
  const [text, setText] = useState(quote?.text ?? "");
  const [sentiment, setSentiment] = useState<Sentiment>(
    quote?.sentiment ?? Sentiment.Neutral,
  );
  const [quality, setQuality] = useState<ContentQuality>(quote?.quality ?? "medium");
  const [speculative, setSpeculative] = useState<boolean>(!!quote?.speculative);
  const [useCases, setUseCases] = useState<Evidence[]>(quote?.useCases ?? []);
  const [features, setFeatures] = useState<Evidence[]>(quote?.features ?? []);

  useEffect(() => {
    if (!opened) return;
    setText(quote?.text ?? "");
    setSentiment(quote?.sentiment ?? Sentiment.Neutral);
    setQuality(quote?.quality ?? "medium");
    setSpeculative(!!quote?.speculative);
    setUseCases(quote?.useCases ?? []);
    setFeatures(quote?.features ?? []);
  }, [opened, quote]);

  const trimmed = text.trim();
  const isInBody =
    commentBody == null ||
    (trimmed.length > 0 &&
      normalizeForMatch(commentBody).includes(normalizeForMatch(trimmed)));
  const showNotInBodyError = trimmed.length > 0 && !isInBody;

  const submit = () => {
    if (!trimmed || !isInBody) return;
    const filteredUseCases = useCases.filter((u) => u.label.trim().length > 0);
    const filteredFeatures = features.filter((f) => f.label.trim().length > 0);
    onSave({
      id: quote?.id ?? generateQuoteId(),
      text: trimmed,
      sentiment,
      quality,
      speculative: speculative || undefined,
      useCases: filteredUseCases.length > 0 ? filteredUseCases : undefined,
      features: filteredFeatures.length > 0 ? filteredFeatures : undefined,
    });
  };

  const issueOptionsForLabel = (featureLabel: string): string[] => {
    const feature = resolvedFeatures.find((f) => f.label === featureLabel);
    return feature?.issues?.map((i) => i.label) ?? [];
  };

  const updateUseCase = (index: number, partial: Partial<Evidence>) => {
    setUseCases((prev) =>
      prev.map((u, i) => (i === index ? { ...u, ...partial } : u)),
    );
  };
  const removeUseCase = (index: number) => {
    setUseCases((prev) => prev.filter((_, i) => i !== index));
  };
  const addUseCase = () => {
    setUseCases((prev) => [...prev, { label: "", sentiment }]);
  };

  const updateFeature = (index: number, partial: Partial<Evidence>) => {
    setFeatures((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f;
        const next = { ...f, ...partial };
        // clear issueType if sentiment is no longer negative
        if (
          partial.sentiment != null &&
          partial.sentiment !== Sentiment.Negative &&
          partial.sentiment !== Sentiment.StrongNegative
        ) {
          next.issueType = undefined;
        }
        return next;
      }),
    );
  };
  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };
  const addFeature = () => {
    setFeatures((prev) => [...prev, { label: "", sentiment: Sentiment.Positive }]);
  };

  const isNegativeSentiment = (s?: Sentiment): boolean =>
    s === Sentiment.Negative || s === Sentiment.StrongNegative;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Edit quote" : "Add quote"}
      size="90%"
      centered
    >
      <Stack gap="sm">
        <Textarea
          label="text"
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          autosize
          minRows={6}
          autoFocus
          size="md"
          error={
            showNotInBodyError
              ? "text must be a substring of the comment body"
              : undefined
          }
        />

        <Group grow align="flex-start">
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
              color={sentimentColor(sentiment)}
            />
          </Box>
          <Box>
            <Text size="sm" fw={500} mb={4}>
              quality
            </Text>
            <SegmentedControl
              data={(["high", "medium", "low"] as ContentQuality[]).map((q) => ({
                value: q,
                label: q,
              }))}
              value={quality}
              onChange={(val) => setQuality(val as ContentQuality)}
              size="xs"
              fullWidth
              color={QUALITY_BADGE[quality].color}
            />
          </Box>
        </Group>

        <Switch
          label="speculative"
          description="hedged / hearsay / future-tense; excluded from rating"
          checked={speculative}
          onChange={(e) => setSpeculative(e.currentTarget.checked)}
        />

        <Box>
          <Text size="sm" fw={500} mb={4}>
            use cases
          </Text>
          <Stack gap="xs">
            {useCases.length === 0 && (
              <Text size="xs" c="dimmed">
                no use cases
              </Text>
            )}
            {useCases.map((u, i) => (
              <Group key={i} gap="xs" wrap="nowrap" align="center">
                <Select
                  placeholder="use case"
                  data={resolvedUseCases}
                  value={u.label || null}
                  onChange={(val) => updateUseCase(i, { label: val ?? "" })}
                  searchable
                  size="xs"
                  style={{ flex: 1 }}
                />
                <SegmentedControl
                  data={Object.values(Sentiment).map((s) => ({
                    value: s,
                    label: humanizeSentiment(s),
                  }))}
                  value={u.sentiment ?? sentiment}
                  onChange={(val) =>
                    updateUseCase(i, { sentiment: val as Sentiment })
                  }
                  size="xs"
                  color={sentimentColor(u.sentiment ?? sentiment)}
                />
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={() => removeUseCase(i)}
                  aria-label="remove use case"
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
              onClick={addUseCase}
              style={{ alignSelf: "flex-start" }}
            >
              add use case
            </Button>
          </Stack>
        </Box>

        <Box>
          <Text size="sm" fw={500} mb={4}>
            features
          </Text>
          <Stack gap="xs">
            {features.length === 0 && (
              <Text size="xs" c="dimmed">
                no features
              </Text>
            )}
            {features.map((f, i) => {
              const negative = isNegativeSentiment(f.sentiment);
              return (
                <Group key={i} gap="xs" wrap="nowrap" align="center">
                  <Select
                    placeholder="feature"
                    data={resolvedFeatureLabels}
                    value={f.label || null}
                    onChange={(val) => updateFeature(i, { label: val ?? "" })}
                    searchable
                    size="xs"
                    style={{ flex: 1 }}
                  />
                  <SegmentedControl
                    data={Object.values(Sentiment).map((s) => ({
                      value: s,
                      label: humanizeSentiment(s),
                    }))}
                    value={f.sentiment ?? Sentiment.Positive}
                    onChange={(val) =>
                      updateFeature(i, { sentiment: val as Sentiment })
                    }
                    size="xs"
                    color={sentimentColor(f.sentiment ?? Sentiment.Positive)}
                  />
                  {negative && (
                    <Select
                      placeholder="issue type"
                      data={
                        f.label ? issueOptionsForLabel(f.label) : []
                      }
                      value={f.issueType ?? null}
                      onChange={(val) =>
                        updateFeature(i, { issueType: val ?? undefined })
                      }
                      clearable
                      searchable
                      size="xs"
                      style={{ flex: 1 }}
                    />
                  )}
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => removeFeature(i)}
                    aria-label="remove feature"
                  >
                    <FaTrash size={10} />
                  </ActionIcon>
                </Group>
              );
            })}
            <Button
              size="compact-xs"
              variant="light"
              color="gray"
              leftSection={<FaPlus size={9} />}
              onClick={addFeature}
              style={{ alignSelf: "flex-start" }}
            >
              add feature
            </Button>
          </Stack>
        </Box>

        <Group justify="space-between" gap="xs" mt="sm">
          {isEdit && onDelete ? (
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<FaTrash size={10} />}
              onClick={onDelete}
            >
              delete
            </Button>
          ) : (
            <Box />
          )}
          <Group gap="xs">
            <Button size="xs" variant="subtle" onClick={onClose}>
              cancel
            </Button>
            <Button size="xs" onClick={submit} disabled={!trimmed || !isInBody}>
              {isEdit ? "save" : "add"}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
