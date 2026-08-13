import type { ProductSpecs, StructuredSpec } from './product-specs';

export interface MatchResultComponents {
  stringSimilarity: number;
  tokenOverlap: number;
  alphaMatch: number;
  aliasMatch: boolean;
  specSimilarity: number;
}

// ─── Input + Options ─────────────────────────────────────────────────────────

export interface ProductSearchInputV2 {
  brand?: string;
  model?: string;
  displayName?: string;
  categoryHint?: string;
  category?: { id?: string; name: string };
  specs?: StructuredSpec[];
  referenceProductId?: string;
  referenceModel?: string;
  modelClues?: string[];
  variantClues?: string[];
  searchBefore?: Date;
  releaseYear?: number;
  contentQuality?: 'high' | 'medium' | 'low';
}

export interface ProductSearchOptionsV2 {
  useEmbedding: boolean;
  webSearchEnabled: boolean;
  mode: 'strict' | 'loose';
}

// ─── Phase outcomes ──────────────────────────────────────────────────────────

export interface FilterOutcomeV2 {
  qualifyingCandidateIds: string[];
  filteredCandidates: Array<{
    candidateId: string;
    candidateName?: string;
    reason: 'match_specs' | 'category';
    detail: string;
  }>;
}

export interface ScoringOutcomeV2 {
  bestCandidate?: {
    candidateId: string;
    alias: string;
    score: number;
  };
  secondScore?: number;
  failedGates?: string[];
  normalizedInput?: string;
}

export interface FinalDecisionV2 {
  kind: 'matcher_accept' | 'matcher_reject' | 'llm_resolved' | 'llm_unresolved';
  /** 0–100 integer. */
  confidence: number;
  reason: string;
  selectedCandidateId?: string;
  evidenceSummary?: string;
  shouldCreateAliases?: Array<{ model: string; region?: string; candidateId: string }>;
}

export interface SearchTotalsV2 {
  durationMs: number;
  cost: number;
  llmCalls: number;
  webSearchCalls: number;
}

export interface PhaseErrorV2 {
  phase:
    | 'reference_product'
    | 'brand_resolution'
    | 'category_resolution'
    | 'recall'
    | 'filter'
    | 'scoring'
    | 'decision'
    | 'finalize';
  message: string;
  detail?: string;
  timestamp: string;
}

export interface ModelVariantV2 {
  model: string;
  source:
    | 'original'
    | 'suffix_strip'
    | 'normalization'
    | 'brand_strip'
    | 'reference_model'
    | 'identification_clue';
}

// ─── Slim snapshots ──────────────────────────────────────────────────────────

export interface SlimReferenceV2 {
  productId: string;
  brand?: string;
  model?: string;
  productCategory?: { id: string; name: string; slug?: string };
  specs: ProductSpecs;
}

export interface SlimResolvedModelV2 {
  id: string;
  brand?: string;
  model?: string;
  displayName?: string;
  categoryId?: string;
  categoryName?: string;
  specs: string[];
}

export interface SlimCandidateV2 {
  productId: string;
  brand?: string;
  model?: string;
  displayName?: string;
  productCategory?: { id: string; name: string; slug?: string };
  specs?: ProductSpecs;
  aliases?: string[];
  source: 'fuzzy' | 'embedding' | 'web';
  matchScore?: number;
  matchComponents?: MatchResultComponents;
}

export interface CandidateFunnelV2 {
  fuzzyHits: number;
  embeddingHits: number;
  webHits: number;
  afterDedupe: number;
  afterReferenceExclusion: number;
}

// ─── Web research evidence ──────────────────────────────────────────────────

export type WebQueryIntentV2 =
  | 'exact_model'
  | 'model_with_specs'
  | 'reference_sibling_sku'
  | 'cross_market';

export interface SearchEvidenceV2 {
  title: string;
  description: string;
  url: string;
  provider: 'dataforseo' | 'exa';
  queryIntent: WebQueryIntentV2;
  modelNumbers: string[];
  resolvedProducts: Array<{
    brand: string;
    model: string;
    productId: string;
    specs: ProductSpecs;
  }>;
}

export interface WebQueryRecordV2 {
  intent: WebQueryIntentV2;
  keyword: string;
  provider: 'dataforseo' | 'exa';
  cacheHit: boolean;
  serpResultCount: number;
}

// ─── Persisted context ──────────────────────────────────────────────────────

export interface ProductSearchContextV2 {
  input: ProductSearchInputV2;
  options: ProductSearchOptionsV2;

  referenceProduct?: SlimReferenceV2;
  effectiveMatchSpecs?: ProductSpecs;

  brand?: { id: string; name: string; similarity: number };
  category?: { id: string; name: string; similarity: number };

  modelVariants: ModelVariantV2[];
  searchedKeywords: string[];
  searchEvidence: SearchEvidenceV2[];
  recallFunnel?: CandidateFunnelV2;
  candidates: SlimCandidateV2[];
  strategiesRun: string[];

  webResearch?: {
    queries: WebQueryRecordV2[];
    extractedModelNumbers: string[];
    webOnlyModels: string[];
  };

  filter?: FilterOutcomeV2;
  scoring?: ScoringOutcomeV2;
  decision?: FinalDecisionV2;

  status: 'INPUT_RECEIVED' | 'RESOLVED' | 'UNRESOLVED';
  resolvedProduct?: SlimResolvedModelV2;

  totals: SearchTotalsV2;
  errors: PhaseErrorV2[];
}

/**
 * Type guard: detect v2 rows at runtime so readers can branch between legacy
 * and v2 shapes without type-system gymnastics.
 */
export function isProductSearchContextV2(
  value: unknown,
): value is ProductSearchContextV2 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ProductSearchContextV2> & Record<string, unknown>;
  if (!Array.isArray(candidate.modelVariants)) return false;
  if (!Array.isArray(candidate.candidates)) return false;
  if (!Array.isArray(candidate.strategiesRun)) return false;
  if (typeof candidate.totals !== 'object' || candidate.totals === null) return false;
  const firstVariant = candidate.modelVariants?.[0] as
    | { searched?: unknown }
    | undefined;
  if (firstVariant && 'searched' in firstVariant) return false;
  return true;
}
