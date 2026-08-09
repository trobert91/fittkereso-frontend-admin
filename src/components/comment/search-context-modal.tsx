import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Divider,
  Grid,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useState } from "react";
import { FaChevronDown, FaChevronRight, FaExternalLinkAlt } from "react-icons/fa";
import { IoMdAlert } from "react-icons/io";
import {
  ProductSearchContextV2,
  SearchEvidenceV2,
  SlimCandidateV2,
  isProductSearchContextV2,
} from "@/models/product-search-context-v2";
import { ProductSpecs } from "@/models/product-specs";
import { JsonEditor } from "../JsonEditor";
import { ChipRow, FieldRow, SectionCard, Stat } from "./modal-primitives";

type SearchContextModalProps = {
  opened: boolean;
  onClose: () => void;
  searchContext: unknown;
};

const STATUS_COLOR: Record<ProductSearchContextV2["status"], string> = {
  RESOLVED: "green",
  UNRESOLVED: "red",
  INPUT_RECEIVED: "gray",
};

const DECISION_COLOR: Record<string, string> = {
  matcher_accept: "green",
  matcher_reject: "red",
  llm_resolved: "green",
  llm_unresolved: "orange",
};

const SOURCE_COLOR: Record<string, string> = {
  fuzzy: "blue",
  embedding: "violet",
  web: "teal",
};

const QUERY_INTENT_LABEL: Record<string, string> = {
  exact_model: "exact model",
  model_with_specs: "model + specs",
  reference_sibling_sku: "sibling SKU",
  cross_market: "cross-market",
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
};

const formatCost = (cost: number): string => {
  if (cost === 0) return "$0";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
};

const formatSpecValue = (
  value: string | number | boolean | string[] | undefined,
): string => {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
};

export const SearchContextModal = ({
  opened,
  onClose,
  searchContext,
}: SearchContextModalProps) => {
  const [rawOpen, setRawOpen] = useState(false);
  const isV2 = isProductSearchContextV2(searchContext);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Search context"
      size="90%"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      {isV2 ? (
        <StructuredView context={searchContext as ProductSearchContextV2} />
      ) : (
        <Alert variant="light" color="yellow" icon={<IoMdAlert />} mb="md">
          This search context is not in v2 format — showing raw JSON.
        </Alert>
      )}

      <Divider my="md" />

      <Group justify="space-between" align="center" mb="xs">
        <Text size="sm" fw={500}>
          Raw JSON
        </Text>
        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          leftSection={
            rawOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />
          }
          onClick={() => setRawOpen((v) => !v)}
        >
          {rawOpen ? "hide" : "show"}
        </Button>
      </Group>

      <Collapse in={rawOpen || !isV2}>
        <JsonEditor
          value={JSON.stringify(searchContext, null, 2)}
          onChange={() => {}}
          schema={undefined}
          compact={false}
          showFormatButton={false}
          maxHeight="600px"
          disabled
        />
      </Collapse>
    </Modal>
  );
};

const StructuredView = ({ context }: { context: ProductSearchContextV2 }) => {
  return (
    <Stack gap="md">
      {context.errors.length > 0 && (
        <Stack gap="xs">
          {context.errors.map((error, i) => (
            <Alert
              key={i}
              variant="light"
              color="red"
              icon={<IoMdAlert />}
              title={`${error.phase}: ${error.message}`}
            >
              {error.detail && (
                <Text size="xs" c="dimmed">
                  {error.detail}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                {error.timestamp}
              </Text>
            </Alert>
          ))}
        </Stack>
      )}

      <HeaderStrip context={context} />
      <DecisionCard context={context} />

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <InputCard context={context} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <ReferenceCard context={context} />
        </Grid.Col>
      </Grid>

      {context.recallFunnel && (
        <RecallFunnelCard context={context} />
      )}

      <CandidatesCard context={context} />

      {context.filter && context.filter.filteredCandidates.length > 0 && (
        <FilteredCandidatesCard context={context} />
      )}

      {context.scoring && <ScoringCard context={context} />}

      {context.webResearch &&
        (context.webResearch.queries.length > 0 ||
          context.searchEvidence.length > 0) && (
          <WebResearchCard context={context} />
        )}

      <KeywordsAndVariantsCard context={context} />

      <FooterStrip context={context} />
    </Stack>
  );
};

const HeaderStrip = ({ context }: { context: ProductSearchContextV2 }) => {
  return (
    <Card withBorder padding="sm" radius="md">
      <Group justify="space-between" wrap="wrap" gap="md">
        <Group gap="xs" wrap="wrap">
          <Badge
            color={STATUS_COLOR[context.status]}
            variant="filled"
            size="lg"
            tt="none"
            radius="sm"
          >
            {context.status}
          </Badge>
          {context.decision && (
            <Badge
              color={DECISION_COLOR[context.decision.kind] ?? "gray"}
              variant="light"
              size="lg"
              tt="none"
              radius="sm"
            >
              {context.decision.kind.replace(/_/g, " ")}
            </Badge>
          )}
          {context.decision && (
            <Badge color="gray" variant="light" size="lg" tt="none" radius="sm">
              confidence {context.decision.confidence}
            </Badge>
          )}
        </Group>

        <Group gap="md" wrap="wrap">
          <Stat label="duration" value={formatDuration(context.totals.durationMs)} />
          <Stat label="cost" value={formatCost(context.totals.cost)} />
          <Stat label="LLM calls" value={String(context.totals.llmCalls)} />
          <Stat label="web calls" value={String(context.totals.webSearchCalls)} />
        </Group>
      </Group>
    </Card>
  );
};

const DecisionCard = ({ context }: { context: ProductSearchContextV2 }) => {
  const decision = context.decision;
  if (!decision) return null;

  const selectedCandidate = decision.selectedCandidateId
    ? context.candidates.find(
        (c) => c.productId === decision.selectedCandidateId,
      )
    : undefined;

  return (
    <SectionCard title="Decision">
      <Stack gap="xs">
        <Group gap="xs" wrap="wrap">
          <FieldRow label="kind" value={decision.kind.replace(/_/g, " ")} />
          <FieldRow label="reason" value={decision.reason} mono />
          <FieldRow label="confidence" value={String(decision.confidence)} />
        </Group>
        {decision.evidenceSummary && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              evidence summary
            </Text>
            <Text size="sm">{decision.evidenceSummary}</Text>
          </Box>
        )}
        {selectedCandidate && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              selected candidate
            </Text>
            <CandidateRow candidate={selectedCandidate} highlighted />
          </Box>
        )}
        {context.resolvedProduct && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              resolved product
            </Text>
            <Text size="sm">
              {context.resolvedProduct.displayName ??
                `${context.resolvedProduct.brand ?? ""} ${context.resolvedProduct.model ?? ""}`}
              {context.resolvedProduct.categoryName && (
                <Text component="span" size="xs" c="dimmed">
                  {" "}
                  · {context.resolvedProduct.categoryName}
                </Text>
              )}
            </Text>
          </Box>
        )}
      </Stack>
    </SectionCard>
  );
};

const InputCard = ({ context }: { context: ProductSearchContextV2 }) => {
  const input = context.input;
  return (
    <SectionCard title="Input">
      <Stack gap="xs">
        {input.displayName && <FieldRow label="display" value={input.displayName} />}
        {input.brand && (
          <Group gap="xs">
            <FieldRow label="brand" value={input.brand} />
            {context.brand && (
              <Tooltip
                label={`brand resolved — similarity ${context.brand.similarity}`}
                withArrow
              >
                <Badge color="blue" variant="light" size="xs" tt="none">
                  → {context.brand.name}
                </Badge>
              </Tooltip>
            )}
          </Group>
        )}
        {input.model && <FieldRow label="model" value={input.model} mono />}
        {context.category && (
          <FieldRow
            label="category"
            value={`${context.category.name} (sim ${context.category.similarity})`}
          />
        )}
        {input.modelClues && input.modelClues.length > 0 && (
          <ChipRow label="model clues" values={input.modelClues} color="orange" />
        )}
        {input.variantClues && input.variantClues.length > 0 && (
          <ChipRow label="variant clues" values={input.variantClues} color="cyan" />
        )}
        {input.specs && input.specs.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              specs
            </Text>
            <Group gap={4} wrap="wrap">
              {input.specs.map((spec, i) => (
                <Badge
                  key={i}
                  color="blue"
                  variant="light"
                  size="sm"
                  tt="none"
                  radius="sm"
                >
                  {spec.name}: {spec.value}
                </Badge>
              ))}
            </Group>
          </Box>
        )}
        {input.contentQuality && (
          <FieldRow label="content quality" value={input.contentQuality} />
        )}
        {input.searchBefore && (
          <FieldRow label="search before" value={String(input.searchBefore)} mono />
        )}
      </Stack>
    </SectionCard>
  );
};

const ReferenceCard = ({ context }: { context: ProductSearchContextV2 }) => {
  const ref = context.referenceProduct;
  if (!ref) {
    return (
      <SectionCard title="Reference product">
        <Text size="sm" c="dimmed">
          No reference product.
        </Text>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Reference product">
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          {ref.brand} {ref.model}
        </Text>
        {ref.productCategory && (
          <FieldRow label="category" value={ref.productCategory.name} />
        )}
        <FieldRow label="product id" value={ref.productId} mono />
        <SpecsGrid specs={ref.specs} highlightedKeys={context.effectiveMatchSpecs} />
      </Stack>
    </SectionCard>
  );
};

const SpecsGrid = ({
  specs,
  highlightedKeys,
}: {
  specs: ProductSpecs | undefined;
  highlightedKeys?: ProductSpecs;
}) => {
  if (!specs || Object.keys(specs).length === 0) {
    return (
      <Text size="xs" c="dimmed">
        no specs
      </Text>
    );
  }
  const keys = Object.keys(specs);
  return (
    <Box>
      <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
        specs
      </Text>
      <Grid gutter={4}>
        {keys.map((key) => {
          const isHighlighted =
            highlightedKeys != null && key in highlightedKeys;
          return (
            <Grid.Col key={key} span={{ base: 12, sm: 6 }}>
              <Group gap={6} wrap="nowrap">
                <Text
                  size="xs"
                  c={isHighlighted ? "yellow.4" : "dimmed"}
                  fw={isHighlighted ? 600 : 400}
                  style={{ minWidth: 110 }}
                >
                  {key}
                </Text>
                <Text size="xs" style={{ wordBreak: "break-word" }}>
                  {formatSpecValue(specs[key])}
                </Text>
              </Group>
            </Grid.Col>
          );
        })}
      </Grid>
    </Box>
  );
};

const RecallFunnelCard = ({ context }: { context: ProductSearchContextV2 }) => {
  const funnel = context.recallFunnel!;
  const qualifying = context.filter?.qualifyingCandidateIds.length ?? 0;
  const steps: Array<{ label: string; value: number; color: string }> = [
    { label: "fuzzy", value: funnel.fuzzyHits, color: "blue" },
    { label: "embedding", value: funnel.embeddingHits, color: "violet" },
    { label: "web", value: funnel.webHits, color: "teal" },
    { label: "after dedupe", value: funnel.afterDedupe, color: "gray" },
    {
      label: "after ref. exclusion",
      value: funnel.afterReferenceExclusion,
      color: "gray",
    },
    { label: "qualifying", value: qualifying, color: "green" },
  ];
  return (
    <SectionCard title="Recall funnel">
      <Group gap={6} wrap="wrap" align="center">
        {steps.map((step, i) => (
          <Group key={step.label} gap={6} wrap="nowrap">
            <Stack gap={0} align="center">
              <Badge
                color={step.color}
                variant="light"
                size="lg"
                radius="sm"
                tt="none"
              >
                {step.value}
              </Badge>
              <Text size="xs" c="dimmed">
                {step.label}
              </Text>
            </Stack>
            {i < steps.length - 1 && (
              <Text c="dimmed" size="sm">
                →
              </Text>
            )}
          </Group>
        ))}
      </Group>
    </SectionCard>
  );
};

const CandidatesCard = ({ context }: { context: ProductSearchContextV2 }) => {
  if (context.candidates.length === 0) {
    return (
      <SectionCard title="Candidates">
        <Text size="sm" c="dimmed">
          No candidates surfaced.
        </Text>
      </SectionCard>
    );
  }
  const sorted = [...context.candidates].sort(
    (a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0),
  );
  const bestId = context.scoring?.bestCandidate?.candidateId;
  const selectedId = context.decision?.selectedCandidateId;
  return (
    <SectionCard title={`Candidates (${context.candidates.length})`}>
      <Stack gap="xs">
        {sorted.map((candidate) => (
          <CandidateRow
            key={candidate.productId}
            candidate={candidate}
            highlighted={
              candidate.productId === selectedId ||
              candidate.productId === bestId
            }
          />
        ))}
      </Stack>
    </SectionCard>
  );
};

const CandidateRow = ({
  candidate,
  highlighted,
}: {
  candidate: SlimCandidateV2;
  highlighted?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const hasSpecs = candidate.specs && Object.keys(candidate.specs).length > 0;
  return (
    <Card
      withBorder
      padding="xs"
      radius="sm"
      style={{
        borderColor: highlighted ? "var(--mantine-color-green-7)" : undefined,
        background: highlighted ? "var(--mantine-color-green-light)" : undefined,
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Group gap="xs" wrap="wrap" style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500}>
            {candidate.displayName ||
              `${candidate.brand ?? ""} ${candidate.model ?? ""}`.trim() ||
              candidate.productId}
          </Text>
          <Badge
            color={SOURCE_COLOR[candidate.source] ?? "gray"}
            variant="light"
            size="xs"
            tt="none"
            radius="sm"
          >
            {candidate.source}
          </Badge>
          {candidate.matchScore != null && (
            <Badge color="gray" variant="light" size="xs" tt="none" radius="sm">
              score {candidate.matchScore}
            </Badge>
          )}
          {candidate.productCategory && (
            <Text size="xs" c="dimmed">
              {candidate.productCategory.name}
            </Text>
          )}
        </Group>
        {(hasSpecs || candidate.matchComponents || candidate.aliases?.length) && (
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            leftSection={
              open ? <FaChevronDown size={9} /> : <FaChevronRight size={9} />
            }
            onClick={() => setOpen((v) => !v)}
          >
            details
          </Button>
        )}
      </Group>
      <Collapse in={open}>
        <Stack gap="xs" mt="xs">
          {candidate.matchComponents && (
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
                match components
              </Text>
              <Group gap="xs" wrap="wrap">
                {Object.entries(candidate.matchComponents).map(([key, value]) => (
                  <Badge
                    key={key}
                    color="gray"
                    variant="outline"
                    size="xs"
                    tt="none"
                    radius="sm"
                  >
                    {key}: {typeof value === "number" ? value.toFixed(2) : String(value)}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}
          {candidate.aliases && candidate.aliases.length > 0 && (
            <ChipRow label="aliases" values={candidate.aliases} color="grape" />
          )}
          {hasSpecs && <SpecsGrid specs={candidate.specs} />}
          <FieldRow label="product id" value={candidate.productId} mono />
        </Stack>
      </Collapse>
    </Card>
  );
};

const FilteredCandidatesCard = ({
  context,
}: {
  context: ProductSearchContextV2;
}) => {
  const filtered = context.filter!.filteredCandidates;
  return (
    <SectionCard title={`Filtered out (${filtered.length})`}>
      <Table withTableBorder withColumnBorders striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Candidate</Table.Th>
            <Table.Th>Reason</Table.Th>
            <Table.Th>Detail</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.map((entry) => (
            <Table.Tr key={entry.candidateId}>
              <Table.Td>
                <Text size="sm">{entry.candidateName ?? entry.candidateId}</Text>
              </Table.Td>
              <Table.Td>
                <Badge
                  color={entry.reason === "match_specs" ? "orange" : "red"}
                  variant="light"
                  size="xs"
                  tt="none"
                  radius="sm"
                >
                  {entry.reason.replace(/_/g, " ")}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="xs" ff="monospace">
                  {entry.detail}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </SectionCard>
  );
};

const ScoringCard = ({ context }: { context: ProductSearchContextV2 }) => {
  const scoring = context.scoring!;
  return (
    <SectionCard title="Scoring">
      <Stack gap="xs">
        {scoring.bestCandidate && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              best candidate
            </Text>
            <Group gap="xs">
              <Text size="sm" ff="monospace">
                {scoring.bestCandidate.alias}
              </Text>
              <Badge color="green" variant="light" size="xs" tt="none" radius="sm">
                score {scoring.bestCandidate.score}
              </Badge>
            </Group>
          </Box>
        )}
        {scoring.secondScore != null && (
          <FieldRow label="second score" value={String(scoring.secondScore)} />
        )}
        {scoring.normalizedInput && (
          <FieldRow
            label="normalized input"
            value={scoring.normalizedInput || "(empty)"}
            mono
          />
        )}
        {scoring.failedGates && scoring.failedGates.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              failed gates
            </Text>
            <Group gap={4} wrap="wrap">
              {scoring.failedGates.map((gate) => (
                <Badge
                  key={gate}
                  color="red"
                  variant="light"
                  size="sm"
                  tt="none"
                  radius="sm"
                >
                  {gate.replace(/_/g, " ")}
                </Badge>
              ))}
            </Group>
          </Box>
        )}
      </Stack>
    </SectionCard>
  );
};

const WebResearchCard = ({ context }: { context: ProductSearchContextV2 }) => {
  const web = context.webResearch!;
  return (
    <SectionCard title="Web research">
      <Stack gap="md">
        {web.queries.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
              queries ({web.queries.length})
            </Text>
            <Stack gap={4}>
              {web.queries.map((query, i) => (
                <Group key={i} gap="xs" wrap="wrap" align="center">
                  <Badge color="teal" variant="light" size="xs" tt="none" radius="sm">
                    {QUERY_INTENT_LABEL[query.intent] ?? query.intent}
                  </Badge>
                  <Badge color="gray" variant="outline" size="xs" tt="none" radius="sm">
                    {query.provider}
                  </Badge>
                  {query.cacheHit && (
                    <Badge color="gray" variant="light" size="xs" tt="none" radius="sm">
                      cache hit
                    </Badge>
                  )}
                  <Badge color="gray" variant="light" size="xs" tt="none" radius="sm">
                    {query.serpResultCount} results
                  </Badge>
                  <Text size="xs" ff="monospace" c="dimmed" style={{ flex: 1, minWidth: 0 }}>
                    {query.keyword}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Box>
        )}

        {web.extractedModelNumbers.length > 0 && (
          <ChipRow
            label="extracted model numbers"
            values={web.extractedModelNumbers}
            color="indigo"
          />
        )}

        {web.webOnlyModels.length > 0 && (
          <ChipRow
            label="web-only models"
            values={web.webOnlyModels}
            color="grape"
          />
        )}

        {context.searchEvidence.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
              search evidence ({context.searchEvidence.length})
            </Text>
            <Stack gap="xs">
              {context.searchEvidence.map((evidence, i) => (
                <EvidenceCard key={i} evidence={evidence} />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </SectionCard>
  );
};

const EvidenceCard = ({ evidence }: { evidence: SearchEvidenceV2 }) => {
  return (
    <Card withBorder padding="xs" radius="sm">
      <Stack gap={4}>
        <Group gap="xs" wrap="wrap">
          <Anchor href={evidence.url} target="_blank" size="sm" fw={500}>
            {evidence.title}
          </Anchor>
          <FaExternalLinkAlt size={9} style={{ opacity: 0.5 }} />
          <Badge color="teal" variant="light" size="xs" tt="none" radius="sm">
            {QUERY_INTENT_LABEL[evidence.queryIntent] ?? evidence.queryIntent}
          </Badge>
          <Badge color="gray" variant="outline" size="xs" tt="none" radius="sm">
            {evidence.provider}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed">
          {evidence.description}
        </Text>
        {evidence.modelNumbers.length > 0 && (
          <Group gap={4} wrap="wrap">
            {evidence.modelNumbers.map((model) => (
              <Badge
                key={model}
                color="indigo"
                variant="light"
                size="xs"
                tt="none"
                radius="sm"
              >
                {model}
              </Badge>
            ))}
          </Group>
        )}
        {evidence.resolvedProducts.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" mb={2}>
              resolved products
            </Text>
            <Stack gap={2}>
              {evidence.resolvedProducts.map((product) => (
                <Text key={product.productId} size="xs" ff="monospace">
                  {product.brand} {product.model}
                </Text>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Card>
  );
};

const KeywordsAndVariantsCard = ({
  context,
}: {
  context: ProductSearchContextV2;
}) => {
  if (
    context.modelVariants.length === 0 &&
    context.searchedKeywords.length === 0
  ) {
    return null;
  }
  return (
    <SectionCard title="Variants & keywords">
      <Stack gap="xs">
        {context.modelVariants.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              model variants
            </Text>
            <Group gap={4} wrap="wrap">
              {context.modelVariants.map((variant, i) => (
                <Tooltip
                  key={i}
                  label={`source: ${variant.source.replace(/_/g, " ")}`}
                  withArrow
                >
                  <Badge
                    color="blue"
                    variant="light"
                    size="sm"
                    tt="none"
                    radius="sm"
                  >
                    {variant.model}
                  </Badge>
                </Tooltip>
              ))}
            </Group>
          </Box>
        )}
        {context.searchedKeywords.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              searched keywords
            </Text>
            <Stack gap={2}>
              {context.searchedKeywords.map((keyword, i) => (
                <Text key={i} size="xs" ff="monospace" c="dimmed">
                  {keyword}
                </Text>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </SectionCard>
  );
};

const FooterStrip = ({ context }: { context: ProductSearchContextV2 }) => {
  return (
    <Group gap="md" wrap="wrap" justify="space-between">
      <Group gap="xs" wrap="wrap">
        <Text size="xs" c="dimmed" tt="uppercase">
          strategies
        </Text>
        {context.strategiesRun.map((strategy) => (
          <Badge
            key={strategy}
            color={SOURCE_COLOR[strategy] ?? "gray"}
            variant="light"
            size="xs"
            tt="none"
            radius="sm"
          >
            {strategy}
          </Badge>
        ))}
      </Group>
      <Group gap="xs" wrap="wrap">
        <Text size="xs" c="dimmed" tt="uppercase">
          options
        </Text>
        <Badge color="gray" variant="outline" size="xs" tt="none" radius="sm">
          mode: {context.options.mode}
        </Badge>
        <Badge
          color={context.options.useEmbedding ? "violet" : "gray"}
          variant="outline"
          size="xs"
          tt="none"
          radius="sm"
        >
          embedding {context.options.useEmbedding ? "on" : "off"}
        </Badge>
        <Badge
          color={context.options.webSearchEnabled ? "teal" : "gray"}
          variant="outline"
          size="xs"
          tt="none"
          radius="sm"
        >
          web {context.options.webSearchEnabled ? "on" : "off"}
        </Badge>
      </Group>
    </Group>
  );
};

