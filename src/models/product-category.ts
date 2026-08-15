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
}

export interface CategoryWithConfigResponse {
  category: ProductCategory;
  config?: ProductCategoryConfig;
}
