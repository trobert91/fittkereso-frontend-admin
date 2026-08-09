import type {
  ContentQuality,
  ProductResolutionCategory,
  RelevanceFactors,
  StructuredSpec,
} from './product-resolution-context';
import type { ValidationIssue } from './validation-issue';

export interface ProductReferenceContext {
  identification: {
    brand?: string;
    model?: string;
    displayName?: string;
    registryKey?: string;
    contentQuality?: ContentQuality;
    categoryHint?: string;
    categories?: string[];
    specs?: StructuredSpec[];
    searchBefore?: Date;
    referenceModel?: string;
    modelClues?: string[];
    variantClues?: string[];
  };

  resolution: {
    preResolvedCategories?: ProductResolutionCategory[];
    enrichedSpecs?: StructuredSpec[];
    resolutionRetriggered?: boolean;
  };

  extraction?: {
    abbreviations?: string[];
    newSpecsDiscovered?: boolean;
    specs?: StructuredSpec[];
  };

  issues?: ValidationIssue[];

  relevance?: {
    factors: RelevanceFactors;
  };
}
