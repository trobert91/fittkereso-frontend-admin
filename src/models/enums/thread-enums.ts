export enum ThreadStatus {
  NEW = "new",
  REPROCESSING = "reprocessing",
  PROCESSING = "processing",
  SELECTED = "selected",
  LOW_ESTIMATION = "low_estimation",
  LLM_NO_CATEGORY = "llm_no_category",
  LLM_LOW_RELEVANCE = "llm_low_relevance",
  PROCESSED = "extracted",
  DELETED = "deleted",
}

export enum ThreadSource {
  Reddit = "reddit",
  Youtube = "youtube",
}

export enum SearchQuerySource {
  Reddit = "reddit",
}
