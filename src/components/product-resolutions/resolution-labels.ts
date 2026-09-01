import { compact, keyBy } from "lodash";
import {
  AiReviewNotExecutedReason,
  ProductResolutionDecisionSnapshot,
  ProductResolutionFlow,
  ProductResolutionOrigin,
  ProductResolutionRecord,
  ProductResolutionStatus,
  RESOLUTION_REVIEW_TRIGGERS,
  ResolutionActionKind,
  ResolutionAiConfidence,
  ResolutionAiVerdict,
  ResolutionCorrection,
  ResolutionDecidedBy,
  ResolutionReviewTrigger,
  ResolutionVerdict,
} from "@/api-actions/product/product-resolutions";
import { ProductModel } from "@/models/product-model";

/** Drives the card's border and header tint, as the status does on the
 *  userscores comment card. */
export const STATUS_COLORS: Record<ProductResolutionStatus, string> = {
  pending: "orange",
  done: "green",
  failed: "red",
  superseded: "gray",
};

export const STATUS_LABELS: Record<ProductResolutionStatus, string> = {
  pending: "pending",
  done: "done",
  failed: "failed",
  superseded: "superseded",
};

export const STATUS_OPTIONS: { value: ProductResolutionStatus; label: string }[] =
  [
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "done", label: "Done" },
    { value: "superseded", label: "Superseded" },
  ];

export const FLOW_LABELS: Record<ProductResolutionFlow, string> = {
  product_resolution: "Resolution",
  duplicate_detection: "Duplicate",
};

export const FLOW_COLORS: Record<ProductResolutionFlow, string> = {
  product_resolution: "cyan",
  duplicate_detection: "grape",
};

export const FLOW_OPTIONS: { value: ProductResolutionFlow; label: string }[] = [
  { value: "product_resolution", label: "Product resolution" },
  { value: "duplicate_detection", label: "Duplicate detection" },
];

export const ORIGIN_LABELS: Record<ProductResolutionOrigin, string> = {
  scrape_time: "Scrape-time",
  nightly_detection: "Nightly",
};

export const ORIGIN_OPTIONS: { value: ProductResolutionOrigin; label: string }[] =
  [
    { value: "scrape_time", label: "Scrape-time (flagged live)" },
    { value: "nightly_detection", label: "Nightly detection" },
  ];

export const VERDICT_LABELS: Record<ResolutionVerdict, string> = {
  matched_existing: "matched existing",
  created_new: "created new",
  duplicate_proposed: "duplicate proposed",
  accept: "accepted",
  decline: "declined",
  reopen: "re-opened",
};

export const VERDICT_COLORS: Record<ResolutionVerdict, string> = {
  matched_existing: "green",
  created_new: "blue",
  duplicate_proposed: "grape",
  accept: "green",
  decline: "red",
  reopen: "orange",
};

type DecisionKind = ProductResolutionDecisionSnapshot["kind"];

/** How the pipeline arrived at its verdict. Worth its own badge next to the
 *  verdict: a match the matcher scored into place is a different kind of claim
 *  than one the LLM adjudicated after the matcher refused it. */
export const DECISION_KIND_LABELS: Record<DecisionKind, string> = {
  matcher_accept: "matcher accepted",
  matcher_reject: "matcher rejected",
  llm_resolved: "LLM resolved",
  llm_unresolved: "LLM unresolved",
};

export const DECISION_KIND_COLORS: Record<DecisionKind, string> = {
  matcher_accept: "teal",
  matcher_reject: "red",
  llm_resolved: "violet",
  llm_unresolved: "orange",
};

/** `decisionSnapshot.reason` is a stage-internal code on the matcher paths and
 *  free-form prose on the LLM ones — these are the codes in reviewer language.
 *  Anything unlisted falls back to the de-underscored token. */
const DECISION_REASON_LABELS: Record<string, string> = {
  matcher_accept: "score cleared the accept floor",
  matcher_accept_best: "highest-scoring candidate",
  matcher_accept_above_threshold: "also above the accept floor",
  no_qualifying_candidates: "nothing survived recall and filtering",
  no_candidates_above_threshold: "no candidate cleared the accept floor",
  below_accept_threshold: "the LLM's pick sat below the accept threshold",
  llm_resolved: "the LLM picked a candidate",
  llm_returned_none: "the LLM picked none of the candidates",
  decision_strategy_error: "the decision stage errored",
  decision_llm_error: "the LLM call failed",
  reference_same: "matched the reference product directly",
};

export function decisionReasonLabel(reason: string): string {
  return DECISION_REASON_LABELS[reason] ?? reason.split("_").join(" ");
}

/** True for the pipeline's snake_case codes, false for the sentences the LLM
 *  strategies write into the same field — which is what decides whether a
 *  reason belongs in a badge or in a paragraph. */
export function isDecisionReasonCode(reason: string): boolean {
  return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(reason);
}

export const ACTION_KIND_LABELS: Record<ResolutionActionKind, string> = {
  match: "matched to product",
  create: "created product",
  merge: "merged products",
  split: "split into new product",
  none: "no catalog change",
};

/** What each correction does, in the reviewer's words. Used on the decline
 *  menu, so the consequence is visible before the click. */
export const CORRECTION_LABELS: Record<ResolutionCorrection, string> = {
  split: "Split into a new product",
  merge_into: "Merge into another product…",
  dismiss: "Just record the disagreement",
};

export const CORRECTION_DESCRIPTIONS: Record<ResolutionCorrection, string> = {
  split:
    "Carve the affected listings out onto a brand-new product, rebuilt from their scraped data.",
  merge_into:
    "Fold this product into one you pick. The source product is deleted afterwards.",
  dismiss: "Record that this was wrong without touching the catalog.",
};

/** `blockedReasons` are machine-readable on purpose; this is where they become
 *  something a reviewer can act on. */
const BLOCKED_REASON_LABELS: Record<string, string> = {
  merge_already_reversed:
    "this merge was already reversed — none of the listings it moved are still on the target",
  source_record_moved:
    "the listing has moved to a different product since this decision",
  listing_product_missing:
    "the product this listing pointed at no longer exists",
  no_source_record:
    "no scraped listing is linked to this record, so there is nothing to split",
  no_listing_product: "this record has no product to merge from",
  superseded: "a newer record replaced this one",
};

export function humanizeBlockedReason(reason: string): string {
  return BLOCKED_REASON_LABELS[reason] ?? reason.split("_").join(" ");
}

// --- Review triggers ---

/** The chip text. Short enough to sit several-abreast on a card, and phrased as
 *  the objection itself rather than as a category name. */
export const TRIGGER_LABELS: Record<ResolutionReviewTrigger, string> = {
  spec_conflict: "spec conflict",
  narrow_margin: "narrow margin",
  name_only_match: "name only",
  gate_only_rejection: "gate-only reject",
  near_miss_rejection: "near miss",
  no_candidates_but_named: "no candidates",
  insufficient_evidence: "no evidence",
};

/**
 * Red is reserved for the two triggers that describe a contradiction in the
 * evidence — a reviewer scanning the queue should be able to spot those without
 * reading. The rest describe *missing* evidence, which is a weaker claim and
 * gets a weaker colour.
 */
export const TRIGGER_COLORS: Record<ResolutionReviewTrigger, string> = {
  spec_conflict: "red",
  narrow_margin: "orange",
  name_only_match: "yellow",
  gate_only_rejection: "grape",
  near_miss_rejection: "orange",
  no_candidates_but_named: "blue",
  insufficient_evidence: "gray",
};

/** The tooltip: what fired it, and why that is worth a look. Long-form on
 *  purpose — these are the definitions a reviewer needs while deciding whether
 *  a trigger is pulling its weight. */
export const TRIGGER_DESCRIPTIONS: Record<ResolutionReviewTrigger, string> = {
  spec_conflict:
    "The system said these are the same product while their specs disagree. The only trigger that reads a direct contradiction rather than missing evidence.",
  narrow_margin:
    "The winning candidate barely beat the runner-up. Margin carries little weight in the confidence score, so a near coin-flip can still score highly.",
  name_only_match:
    "The match rests on the name alone — no comparable specs and no alias backing it. Two products whose names happen to look alike score exactly like this.",
  gate_only_rejection:
    "A candidate scored well enough to accept and a quality gate stopped it. Whether the gate was right is the question no stored signal answers.",
  near_miss_rejection:
    "The best candidate fell just short of the accept threshold, so a new product was created instead. Distinct from a narrow margin: this compares to the bar, not to the runner-up.",
  no_candidates_but_named:
    "Nothing was recalled for a listing that named a brand and a model, and the catalog does hold that brand in that category — so finding nothing is surprising. Usually a brand-alias gap or an over-tight filter.",
  insufficient_evidence:
    "Nothing was recalled and the input named no brand or model. Not judgeable from what is stored, by a human or the AI.",
};

export const TRIGGER_OPTIONS: {
  value: ResolutionReviewTrigger;
  label: string;
}[] = RESOLUTION_REVIEW_TRIGGERS.map((trigger) => ({
  value: trigger,
  label: TRIGGER_LABELS[trigger],
}));

// --- The automated reviewers ---

export const AI_CONFIDENCE_LABELS: Record<ResolutionAiConfidence, string> = {
  low: "AI unsure",
  medium: "AI leaning",
  high: "AI confident",
};

/** Green only for `high`, because only `high` authorises the AI to act. The
 *  other two mean the row is still yours. */
export const AI_CONFIDENCE_COLORS: Record<ResolutionAiConfidence, string> = {
  low: "gray",
  medium: "yellow",
  high: "green",
};

export const AI_CONFIDENCE_OPTIONS: {
  value: ResolutionAiConfidence;
  label: string;
}[] = [
  { value: "low", label: "Low — couldn't decide" },
  { value: "medium", label: "Medium — advisory only" },
  { value: "high", label: "High — acted on it" },
];

export const AI_VERDICT_LABELS: Record<ResolutionAiVerdict, string> = {
  agree: "agreed with the system",
  disagree: "disagreed",
  abstain: "abstained",
};

/**
 * Why an AI verdict was not carried out.
 *
 * Worth spelling out rather than showing a bare "not executed": most of these
 * are a *setting*, not a judgement, and someone wondering why the model did
 * nothing needs to know which. `stale` in particular is not a failure — it is
 * the system correctly refusing to apply an answer to a question that changed.
 */
export const NOT_EXECUTED_REASONS: Record<AiReviewNotExecutedReason, string> = {
  not_confident:
    "Not confident enough to act on its own — it is left for you to decide.",
  execution_disabled: "AI execution is switched off, so this is advice only.",
  destructive_disabled:
    "Merges and splits are switched off for the AI, so this needs your confirmation.",
  action_unavailable:
    "The row cannot take that action — it changed since the AI looked at it.",
  stale:
    "The row changed while the AI was thinking, so its answer was discarded rather than applied.",
  failed: "The AI tried to carry it out and it failed.",
};

export function notExecutedMessage(
  reason: AiReviewNotExecutedReason | undefined,
  reasoning: string,
): string {
  const explanation = reason ? NOT_EXECUTED_REASONS[reason] : undefined;
  return explanation ? `${explanation} — ${reasoning}` : reasoning;
}

export const DECIDED_BY_LABELS: Record<ResolutionDecidedBy, string> = {
  system: "auto-accepted",
  ai: "decided by AI",
  admin: "decided by you",
};

export const DECIDED_BY_COLORS: Record<ResolutionDecidedBy, string> = {
  system: "teal",
  ai: "violet",
  admin: "blue",
};

export const DECIDED_BY_OPTIONS: {
  value: ResolutionDecidedBy;
  label: string;
}[] = [
  { value: "system", label: "Deterministic auto-accept" },
  { value: "ai", label: "AI reviewer" },
  { value: "admin", label: "A human" },
];

/**
 * What the queue can say about a row's classification. Three states, not two,
 * and the distinction is the whole point of the filter: a row the nightly sweep
 * has not reached is *unknown*, not clean, and must never be read as though it
 * had been checked.
 */
export type TriggerFilterMode = "any" | "untriggered" | "triggered";

export const TRIGGER_MODE_OPTIONS: {
  value: TriggerFilterMode;
  label: string;
}[] = [
  { value: "any", label: "Any" },
  { value: "untriggered", label: "Nothing fired (what auto-accept trusts)" },
  { value: "triggered", label: "Something fired" },
];

export function similarityColor(score: number): string {
  if (score >= 80) return "red";
  if (score >= 60) return "orange";
  return "yellow";
}

/**
 * Every product the row carries a full object for, keyed by id.
 *
 * Candidates are stored as a jsonb snapshot holding only ids and names — no
 * images — so this is how a candidate card gets a picture when the product
 * happens to also be one of the row's joined relations (which the chosen one
 * almost always is). Candidates with no match fall back to a name-only card.
 */
export function productLookup(
  resolution: ProductResolutionRecord,
): Record<string, ProductModel> {
  return keyBy(
    compact([
      resolution.productA,
      resolution.productB,
      resolution.resolvedProduct,
      resolution.sourceRecord?.model,
    ]),
    "id",
  );
}

/** The system's own verdict — always index 0 of the append-only log. */
export function systemDecision(resolution: ProductResolutionRecord) {
  return resolution.decisions?.[0];
}

/** How many candidates were rejected by a gate. The single best "is the
 *  automated call likely wrong?" signal available without opening the row. */
export function failedGateCount(resolution: ProductResolutionRecord): number {
  return (resolution.candidates ?? []).filter(
    (candidate) => !candidate.gates?.passed,
  ).length;
}

/** What the filter stage objected to, in reviewer language. The raw reasons are
 *  pipeline-internal names; these say what the reviewer would say. */
export const FILTER_REASON_LABELS: Record<string, string> = {
  match_specs: "spec contradiction",
  category: "wrong category",
  brand: "wrong brand",
};

export function filterReasonLabel(reason: string): string {
  return FILTER_REASON_LABELS[reason] ?? reason.split("_").join(" ");
}

/** Candidates the filter dropped before they were ever scored.
 *
 *  Worth surfacing separately from a gate failure: a gate-failed candidate was
 *  compared and found wanting, while a filtered one was excluded on a single
 *  contradiction and never competed at all. When the filter is miscalibrated —
 *  a spec vocabulary mismatch between two shops, say — the right answer is
 *  sitting in this list, which is why it must not read as "nothing recalled". */
export function filteredCandidates(resolution: ProductResolutionRecord) {
  return (resolution.candidates ?? []).filter((candidate) => candidate.filtered);
}
