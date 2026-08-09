import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Divider,
  Grid,
  Group,
  Modal,
  Progress,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { IoMdAlert } from "react-icons/io";
import { ProductReferenceContext } from "@/models/product-reference-context";
import { ValidationIssue } from "@/models/validation-issue";
import { RelevanceFactors } from "@/models/product-resolution-context";
import { JsonEditor } from "../JsonEditor";
import { ChipRow, FieldRow, SectionCard, Stat } from "./modal-primitives";
import { IssueRow, SEVERITY_COLOR, issuesWorstSeverity } from "./issue-row";

type ContextModalProps = {
  opened: boolean;
  onClose: () => void;
  context: ProductReferenceContext;
};

const FACTOR_LABELS: Record<keyof RelevanceFactors, string> = {
  depthMultiplier: "depth",
  quoteQualityMultiplier: "quote quality",
  sentimentMultiplier: "sentiment",
  experienceMultiplier: "experience",
  experienceFloorBonus: "experience floor",
  featureMultiplier: "feature",
  useCaseMultiplier: "use case",
  featureUseCaseMultiplier: "feature ✕ use case",
  intentMultiplier: "intent",
  upvoteBoost: "upvote",
};

const MULTIPLIER_KEYS: Array<keyof RelevanceFactors> = [
  "depthMultiplier",
  "quoteQualityMultiplier",
  "sentimentMultiplier",
  "experienceMultiplier",
  "featureMultiplier",
  "useCaseMultiplier",
  "featureUseCaseMultiplier",
  "intentMultiplier",
];

const formatMultiplier = (value: number | undefined): string => {
  if (value == null) return "—";
  return value.toFixed(2);
};

export const ContextModal = ({
  opened,
  onClose,
  context,
}: ContextModalProps) => {
  const [rawOpen, setRawOpen] = useState(false);

  const hasIdentification =
    context.identification && Object.keys(context.identification).length > 0;
  const hasResolution =
    context.resolution && Object.keys(context.resolution).length > 0;
  const hasExtraction =
    context.extraction && Object.keys(context.extraction).length > 0;
  const issues = context.issues ?? [];
  const factors = context.relevance?.factors;

  const computedRelevance = factors ? computeRelevance(factors) : undefined;

  const worstSeverity = issuesWorstSeverity(issues);

  const identificationType = (
    context.identification as { type?: string } | undefined
  )?.type;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Context"
      size="90%"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        <Card withBorder padding="sm" radius="md">
          <Group justify="space-between" wrap="wrap" gap="md">
            <Group gap="xs" wrap="wrap">
              <Badge
                color={worstSeverity ? SEVERITY_COLOR[worstSeverity] : "gray"}
                variant={issues.length > 0 ? "filled" : "light"}
                size="lg"
                tt="none"
                radius="sm"
              >
                {issues.length === 0
                  ? "no issues"
                  : `${issues.length} issue${issues.length === 1 ? "" : "s"}`}
              </Badge>
              {identificationType !== undefined && (
                <Badge
                  color="blue"
                  variant="light"
                  size="lg"
                  tt="none"
                  radius="sm"
                >
                  {identificationType}
                </Badge>
              )}
              {context.identification?.contentQuality && (
                <Badge
                  color={contentQualityColor(
                    context.identification.contentQuality,
                  )}
                  variant="light"
                  size="lg"
                  tt="none"
                  radius="sm"
                >
                  {context.identification.contentQuality} quality
                </Badge>
              )}
            </Group>
            <Group gap="md" wrap="wrap">
              {computedRelevance != null && (
                <Stat
                  label="relevance"
                  value={computedRelevance.toFixed(2)}
                />
              )}
              {factors?.experienceFloorBonus != null && (
                <Stat
                  label="floor bonus"
                  value={`+${factors.experienceFloorBonus}`}
                />
              )}
              {factors?.upvoteBoost != null && (
                <Stat
                  label="upvote boost"
                  value={`+${factors.upvoteBoost.toFixed(2)}`}
                />
              )}
            </Group>
          </Group>
        </Card>

        {hasIdentification && (
          <IdentificationCard
            identification={context.identification!}
          />
        )}

        {issues.length > 0 && <IssuesCard issues={issues} />}

        {factors && <RelevanceCard factors={factors} />}

        {hasExtraction && (
          <ExtractionCard extraction={context.extraction!} />
        )}

        {hasResolution && (
          <ResolutionCard resolution={context.resolution!} />
        )}
      </Stack>

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

      <Collapse in={rawOpen}>
        <JsonEditor
          value={JSON.stringify(context, null, 2)}
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

const IdentificationCard = ({
  identification,
}: {
  identification: ProductReferenceContext["identification"];
}) => {
  const id = identification as ProductReferenceContext["identification"] & {
    type?: string;
    categoryHint?: string;
  };
  return (
    <SectionCard title="Identification">
      <Stack gap="xs">
        <Group gap="md" wrap="wrap">
          {id.displayName && (
            <FieldRow label="display name" value={id.displayName} />
          )}
          {id.brand && <FieldRow label="brand" value={id.brand} />}
          {id.model && <FieldRow label="model" value={id.model} mono />}
        </Group>
        {id.referenceModel && (
          <FieldRow
            label="reference model"
            value={id.referenceModel}
            mono
          />
        )}
        {id.registryKey && (
          <FieldRow label="registry key" value={id.registryKey} mono />
        )}
        {id.categoryHint && (
          <FieldRow label="category hint" value={id.categoryHint} />
        )}
        {id.searchBefore && (
          <FieldRow
            label="search before"
            value={String(id.searchBefore)}
            mono
          />
        )}
        {id.modelClues && id.modelClues.length > 0 && (
          <ChipRow label="model clues" values={id.modelClues} color="orange" />
        )}
        {id.variantClues && id.variantClues.length > 0 && (
          <ChipRow label="variant clues" values={id.variantClues} color="cyan" />
        )}
        {id.categories && id.categories.length > 0 && (
          <ChipRow label="categories" values={id.categories} color="blue" />
        )}
        {id.specs && id.specs.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              specs
            </Text>
            <Group gap={4} wrap="wrap">
              {id.specs.map((spec, i) => (
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
      </Stack>
    </SectionCard>
  );
};

const IssuesCard = ({ issues }: { issues: ValidationIssue[] }) => {
  return (
    <SectionCard title={`Issues (${issues.length})`}>
      <Stack gap="xs">
        {issues.map((issue, i) => (
          <IssueRow key={i} issue={issue} />
        ))}
      </Stack>
    </SectionCard>
  );
};

const RelevanceCard = ({ factors }: { factors: RelevanceFactors }) => {
  return (
    <SectionCard title="Relevance factors">
      <Stack gap="xs">
        <Grid gutter="xs">
          {MULTIPLIER_KEYS.map((key) => {
            const value = factors[key];
            if (value == null) return null;
            return (
              <Grid.Col key={key} span={{ base: 12, sm: 6 }}>
                <MultiplierBar
                  label={FACTOR_LABELS[key]}
                  value={value as number}
                />
              </Grid.Col>
            );
          })}
        </Grid>
        <Divider my={4} />
        <Group gap="md" wrap="wrap">
          <FieldRow
            label="experience floor bonus"
            value={`+${factors.experienceFloorBonus}`}
            mono
          />
          {factors.upvoteBoost != null && (
            <FieldRow
              label="upvote boost"
              value={`+${factors.upvoteBoost.toFixed(4)}`}
              mono
            />
          )}
        </Group>
      </Stack>
    </SectionCard>
  );
};

const MultiplierBar = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => {
  // Map 0..2 → 0..100% with 1.0 = 50% (neutral). Clamp the bar so extremes
  // still render, but show the raw number alongside.
  const clamped = Math.max(0, Math.min(2, value));
  const percent = (clamped / 2) * 100;
  const color = value >= 1 ? (value > 1 ? "green" : "gray") : "red";
  return (
    <Tooltip
      label={`${label}: ×${value.toFixed(4)}`}
      withArrow
      position="top"
    >
      <Box>
        <Group justify="space-between" gap="xs">
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Text size="xs" ff="monospace" fw={500}>
            ×{formatMultiplier(value)}
          </Text>
        </Group>
        <Progress
          value={percent}
          color={color}
          size="sm"
          radius="sm"
          mt={2}
        />
      </Box>
    </Tooltip>
  );
};

const ExtractionCard = ({
  extraction,
}: {
  extraction: NonNullable<ProductReferenceContext["extraction"]>;
}) => {
  return (
    <SectionCard title="Extraction">
      <Stack gap="xs">
        {extraction.abbreviations && extraction.abbreviations.length > 0 && (
          <ChipRow
            label="abbreviations"
            values={extraction.abbreviations}
            color="grape"
          />
        )}
        {extraction.newSpecsDiscovered != null && (
          <FieldRow
            label="new specs discovered"
            value={extraction.newSpecsDiscovered ? "yes" : "no"}
          />
        )}
        {extraction.specs && extraction.specs.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              specs
            </Text>
            <Group gap={4} wrap="wrap">
              {extraction.specs.map((spec, i) => (
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
      </Stack>
    </SectionCard>
  );
};

const ResolutionCard = ({
  resolution,
}: {
  resolution: ProductReferenceContext["resolution"];
}) => {
  return (
    <SectionCard title="Resolution">
      <Stack gap="xs">
        {resolution.resolutionRetriggered != null && (
          <FieldRow
            label="resolution retriggered"
            value={resolution.resolutionRetriggered ? "yes" : "no"}
          />
        )}
        {resolution.preResolvedCategories &&
          resolution.preResolvedCategories.length > 0 && (
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
                pre-resolved categories
              </Text>
              <Group gap={4} wrap="wrap">
                {resolution.preResolvedCategories.map((category) => (
                  <Tooltip
                    key={category.id}
                    label={`similarity ${category.similarity}`}
                    withArrow
                  >
                    <Badge
                      color="blue"
                      variant="light"
                      size="sm"
                      tt="none"
                      radius="sm"
                    >
                      {category.name}
                    </Badge>
                  </Tooltip>
                ))}
              </Group>
            </Box>
          )}
        {resolution.enrichedSpecs && resolution.enrichedSpecs.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
              enriched specs
            </Text>
            <Group gap={4} wrap="wrap">
              {resolution.enrichedSpecs.map((spec, i) => (
                <Badge
                  key={i}
                  color="violet"
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
      </Stack>
    </SectionCard>
  );
};

function computeRelevance(factors: RelevanceFactors): number {
  return (
    factors.depthMultiplier *
    factors.quoteQualityMultiplier *
    factors.sentimentMultiplier *
    factors.experienceMultiplier *
    factors.featureMultiplier *
    factors.useCaseMultiplier *
    factors.featureUseCaseMultiplier *
    (factors.intentMultiplier ?? 1)
  );
}

function contentQualityColor(quality: string): string {
  switch (quality) {
    case "high":
      return "green";
    case "medium":
      return "blue";
    case "low":
      return "orange";
    default:
      return "gray";
  }
}

