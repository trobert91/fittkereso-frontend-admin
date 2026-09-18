import { BaseEntity } from "./base-entity";
import {
  SpecDefinitionJsonSchema,
  SpecDefinitionUiSchema,
} from "./product-specs";
import { RelevanceTerm } from "./relevance-terms";

export interface ProductCategory extends BaseEntity {
  name: string;

  slug?: string;

  parent?: ProductCategory;

  enabled?: boolean;

  aliases?: string[];

  jsonSchema?: SpecDefinitionJsonSchema;

  uiSchema?: SpecDefinitionUiSchema;

  config?: ProductCategoryConfig;
}

export interface ValidSpecDefinition {
  name: string;
  examples: string;
}

export interface CategoryPromptConfig {
  specialInstructions?: string;
  validSpecs?: ValidSpecDefinition[];
  labelingExamples?: Record<string, unknown>;
}

export interface UseCaseConfig {
  label: string;
  description?: string;
  implications?: string[];
}

export interface IssueConfig {
  label: string;
  description: string;
}

export interface FeatureLabelConfig {
  label: string;
  description?: string;
  shortDescription?: string;
  issues?: IssueConfig[];
}

export interface ProductCategoryConfig {
  keywordIdentifiers?: string[];
  relevanceTerms?: RelevanceTerm[];
  useCases?: UseCaseConfig[];
  features?: FeatureLabelConfig[];
  promptConfig?: CategoryPromptConfig;

  /**
   * The matching gates, in the order the category declares them. A primary
   * spec contradicting costs a duplicate pair 30 points and a matcher spec 5,
   * which is why the duplicate compare modal groups its spec tables this way.
   *
   * Served by `GET /admin-category/:id?includeConfig=true`, which reads the
   * category's own `config.json` — these are not columns on the category row.
   */
  primarySpecs?: string[];
  matcherSpecs?: string[];
}

export interface CategoryWithConfigResponse {
  category: ProductCategory;
  config?: ProductCategoryConfig;
}
