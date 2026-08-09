import { BasePageResult } from "./base-page-result";

export enum ThreadRunStatus {
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface ThreadRunModelUsage {
  model: string;
  provider: string | null;
  callCount: number;
  costUsd: number;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
}

export interface ThreadRunStepStats {
  costUsd: number;
  llmCallCount: number;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  durationMs?: number;
}

export interface ThreadRunOpSummarizationStep extends ThreadRunStepStats {
  summarized: boolean;
}

export interface ThreadRunProductIdentificationStep extends ThreadRunStepStats {
  mentionsIdentified: number;
}

export interface ThreadRunExtractionStep extends ThreadRunStepStats {
  retryCount: number;
  quoteCount: number;
  intentLabelsApplied: number;
}

export interface ThreadRunLabelingStep extends ThreadRunStepStats {
  featureLabelsApplied: number;
  useCaseLabelsApplied: number;
  issueCount: number;
  issuesByType?: Record<string, number>;
}

export interface ThreadRunProductResolutionStep extends ThreadRunStepStats {
  productReferenceCount: number;
  productReferencesEnabled: number;
  productReferencesResolved: number;
  productReferencesDeferred: number;
  distinctProductsResolved: number;
  distinctProductsInRegistry: number;
}

export interface ThreadRunValidationStep extends ThreadRunStepStats {
  decisions: { approved: number; inReview: number; deleted: number };
}

export interface ThreadRunDetails {
  thread: {
    commentCount: number;
    commentsProcessed: number;
    commentsSkipped: number;
    commentsIdentified: number;
    subtreeCount: number;
  };
  steps: {
    opSummarization: ThreadRunOpSummarizationStep;
    productIdentification: ThreadRunProductIdentificationStep;
    extraction: ThreadRunExtractionStep;
    labeling: ThreadRunLabelingStep;
    productResolution: ThreadRunProductResolutionStep;
    validation: ThreadRunValidationStep;
    relevance: ThreadRunStepStats;
    imageAnalysis: ThreadRunStepStats;
    translation: ThreadRunStepStats;
    other: ThreadRunStepStats;
  };
  models: {
    totalLlmCallCount: number;
    usage: ThreadRunModelUsage[];
  };
}

export interface ThreadRunError {
  message: string;
  name?: string;
}

export interface ThreadRun {
  id: string;
  thread?: { id: string };
  status: ThreadRunStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  totalCostUsd: number | null;
  details?: ThreadRunDetails | null;
  error?: ThreadRunError | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadRunSearchParams {
  statuses?: ThreadRunStatus[];
  threadId?: string;
  startedAtFrom?: string;
  startedAtTo?: string;
  page?: number;
  pageSize?: number;
  sort?: "status" | "startedAt" | "completedAt" | "durationMs" | "totalCostUsd" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
}

export type ThreadRunSearchResult = BasePageResult<ThreadRun> & {
  statuses?: ThreadRunStatus[];
  threadId?: string;
  startedAtFrom?: string;
  startedAtTo?: string;
};
