import { ProductModel } from "./product-model";
import { StructuredSpec } from "./product-specs";
import { ContentQuality } from "./thread-extraction-models";

export type { StructuredSpec } from "./product-specs";
export type { ContentQuality } from "./thread-extraction-models";

export interface ProductResolutionInput {
  brand?: string;
  model?: string;
  displayName?: string;
  categories?: string[];
  abbreviations?: string[];
  specs?: StructuredSpec[];
  searchBefore?: Date;
  registryKey?: string;
  contentQuality?: ContentQuality;
  categoryHint?: string;
  releaseYear?: number;
  referenceProductId?: string;
  referenceModel?: string;
  modelClues?: string[];
  variantClues?: string[];
}

export interface ProductReferenceEvaluation {
  referenceId: string;
  relevance: number;
}

export interface ProductResolutionResult extends ProductResolutionContext {
  resolvedModel?: ProductModel;
}

export interface ProductResolutionContext {
  input: ProductResolutionInput;
  originalInput?: ProductResolutionInput;
  refinedInput?: ProductResolutionInput;
  candidates?: EvaluatedProduct[];
  brand?: ProductResolutionBrand;
  categories?: ProductResolutionCategory[];
  preResolvedCategories?: ProductResolutionCategory[];
  googleSearchKeywords?: string[];
  shouldPerformWebSearch?: boolean;
  googleResults?: GoogleSerpResult[];
  serpCandidates?: ProductResolutionInput[];
  coverage?: number;
  relevance?: number;
  isOp?: boolean;
  webSearchEvaluation?: {
    confidence: number;
    skipped: boolean;
  };
  webSearch?: {
    keyword?: string;
    provider?: 'dataforseo' | 'exa';
    source?: 'cache' | 'api';
    providerSelectionReason?:
      | 'request_override'
      | 'default_provider_exa'
      | 'default_provider_dataforseo'
      | 'op_priority'
      | 'high_relevance'
      | 'fallback_dataforseo';
    cacheHit?: boolean;
    cacheEntryId?: string;
    searchDate?: Date;
    relevance?: number;
    isOp?: boolean;
    metadata?: {
      similarity?: number;
      cacheDateDiff?: number;
      cacheEntryId?: string;
    };
    skippedByEvaluator?: boolean;
    evaluatorConfidence?: number;
  };
  phaseTimings?: Record<string, number>;
  resolvedPhase?:
    | 'initialResolve'
    | 'suffixStripRetry'
    | 'normalizedModelRetry'
    | 'webSearchRefinement'
    | 'crossMarketSearch';
  crossMarketSearch?: CrossMarketSearchInfo;
  resolutionDiagnostics?: {
    inputValidation?: {
      valid: boolean;
      reason?: 'missing_identifiers' | 'too_short' | 'too_many_special_chars';
      specialCharRatio?: number;
    };
    earlyExitReason?:
      | 'invalid_input'
      | 'insufficient_product_info'
      | 'no_candidates';
    candidateFunnel?: {
      fuzzyCount: number;
      embeddingCount: number;
      totalBeforeDedupe: number;
      totalAfterDedupe: number;
    };
    brandCorrection?: {
      originalBrand: string;
      correctedBrand: string;
    };
  };
  matchDiagnostics?: MatchDiagnostics;
  validationResult?: {
    issueType: 'wrong_product' | 'wrong_quotes' | 'wrong_metadata';
    reviewComment: string;
    quoteIndices?: number[];
    field?: 'sentiment' | 'experience' | 'depth';
    originalValue?: string;
    correctedValue?: string;
    autoFixed: boolean;
    autoFixSuccessful: boolean;
    suppressed: boolean;
  };
  relevanceFactors?: RelevanceFactors;
}

export interface RelevanceFactors {
  depthMultiplier: number;
  quoteQualityMultiplier: number;
  sentimentMultiplier: number;
  experienceMultiplier: number;
  experienceFloorBonus: number;
  featureMultiplier: number;
  useCaseMultiplier: number;
  featureUseCaseMultiplier: number;
  intentMultiplier?: number;
  upvoteBoost?: number;
}

export interface MatchResultComponents {
  stringSimilarity: number;
  tokenOverlap: number;
  alphaMatch: number;
  aliasMatch: boolean;
  specSimilarity: number;
}

export interface MatchCandidateDiagnostics {
  candidateId: string;
  alias: string;
  score: number;
  components: MatchResultComponents;
  yearAdjustment?: {
    inputYear?: number;
    candidateYear?: number;
    scoreDelta: number;
  };
}

export interface MatchDiagnostics {
  normalizedInput?: string;
  inputTokens?: string[];
  criticalAlphaTokens?: string[];
  categoryStrictness?: 'strict' | 'moderate' | 'loose';
  droppedSpecs?: StructuredSpec[];
  bestCandidate?: MatchCandidateDiagnostics;
  secondScore?: number;
  failedGates?: string[];
}

export interface CrossMarketVariant {
  model: string;
  region?: string;
  confidence: number;
}

export interface CrossMarketSearchInfo {
  keyword?: string;
  usedFallback?: boolean;
  webSearch?: {
    keyword?: string;
    provider?: 'dataforseo' | 'exa';
    source?: 'cache' | 'api';
    cacheHit?: boolean;
    cacheEntryId?: string;
  };
  serpResultCount?: number;
  rawVariants?: CrossMarketVariant[];
  filteredVariants?: Array<CrossMarketVariant & { resolved: boolean }>;
  skippedReason?: 'no_brand' | 'no_model' | 'disabled';
  minConfidence?: number;
  regions?: string[];
}

export interface ProductResolutionOptions {
  useEmbedding: boolean;
  webSearchEnabled: boolean;
  mode: ProductResolutionMode;
  crossMarketSearchEnabled?: boolean;
  crossMarketSearchMinConfidence?: number;
}

export enum ProductResolutionMode {
  loose = "loose",
  strict = "strict",
}

export interface ProductResolutionBrand {
  id: string;
  name: string;
  domains?: string[];
  similarity: number;
}

export interface ProductResolutionCategory {
  id: string;
  name: string;
  similarity: number;
  cacheConfig?: {
    pastToleranceDays?: number;
    futureToleranceDays?: number;
  };
}

export interface GoogleSerpResult {
  title: string;
  description: string;
  url: string;
}

export interface ProductData {
  id: string;
  model?: string;
  brand?: string;
  displayName?: string;
  aliases?: string[];
}

export interface EvaluatedProduct extends ProductData {
  confidence?: number;
  source?: string;
  matchedAlias?: string;
}

export interface ProductWebSearchResult {
  suggestedInput: Partial<ProductResolutionInput>;
  googleResults?: GoogleSerpResult[];
  provider: 'dataforseo' | 'exa';
  validation?: {
    score: number;
    issues: string[];
    evidence: {
      brandConsistency: number;
      modelOccurrences: number;
      authorityScore: number;
    };
  };
}
