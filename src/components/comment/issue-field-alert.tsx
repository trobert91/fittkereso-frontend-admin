import { Tooltip } from "@mantine/core";
import { IoMdAlert } from "react-icons/io";
import type { ValidationIssue, ValidationIssueType } from "@/models/validation-issue";

export type IssueField =
  | "sentiment"
  | "experience"
  | "depth"
  | "intent"
  | "product"
  | "quote"
  | "feature"
  | "useCase"
  | "comment";

const FIELD_BY_TYPE: Record<ValidationIssueType, IssueField | undefined> = {
  wrong_sentiment: "sentiment",
  wrong_experience: "experience",
  wrong_depth: "depth",
  wrong_intent: "intent",
  wrong_product: "product",
  quote_not_verbatim: "quote",
  quote_duplicate: "quote",
  wrong_quote_attribution: "quote",
  wrong_quote_quality: "quote",
  speculative_flag_mismatch: "quote",
  boundary_violation: "comment",
  discovered_products_present: "comment",
  cheat_sheet_collapse_with_contrast_cue: "product",
  suffix_alpha_mismatch: "product",
  multiple_candidates_resolved: "product",
  low_recency_evidence: "product",
  resolved_via_web_search: "product",
  unresolved_after_search: "product",
  duplicate_model: "product",
};

export function unresolvedIssuesForField(
  issues: ValidationIssue[] | undefined,
  field: IssueField,
): ValidationIssue[] {
  if (!issues || issues.length === 0) return [];
  return issues.filter(
    (issue) =>
      issue.status !== "resolved" && FIELD_BY_TYPE[issue.type] === field,
  );
}

export const IssueFieldAlert = ({
  issues,
  field,
  size = 12,
}: {
  issues: ValidationIssue[] | undefined;
  field: IssueField;
  size?: number;
}) => {
  const matching = unresolvedIssuesForField(issues, field);
  if (matching.length === 0) return null;

  const tooltipLabel = matching
    .map((issue) => {
      const reasoning = issue.reasoning ? ` — ${issue.reasoning}` : "";
      return `${issue.type.split("_").join(" ")}${reasoning}`;
    })
    .join("\n");

  return (
    <Tooltip label={tooltipLabel} withArrow multiline maw={400}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "var(--mantine-color-red-6)",
        }}
      >
        <IoMdAlert size={size} />
      </span>
    </Tooltip>
  );
};
