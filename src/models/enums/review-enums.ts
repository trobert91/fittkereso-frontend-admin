export enum Sentiment {
  StrongPositive = "strongPositive",
  Positive = "positive",
  Neutral = "neutral",
  Negative = "negative",
  StrongNegative = "strongNegative",
  Mixed = "mixed",
}

export const POSITIVE_SENTIMENTS: ReadonlySet<Sentiment> = new Set([
  Sentiment.StrongPositive,
  Sentiment.Positive,
]);

export const NEGATIVE_SENTIMENTS: ReadonlySet<Sentiment> = new Set([
  Sentiment.StrongNegative,
  Sentiment.Negative,
]);

export const STRONG_SENTIMENTS: ReadonlySet<Sentiment> = new Set([
  Sentiment.StrongPositive,
  Sentiment.StrongNegative,
]);

export function isPositiveSentiment(sentiment: Sentiment | null | undefined): boolean {
  return sentiment != null && POSITIVE_SENTIMENTS.has(sentiment);
}

export function isNegativeSentiment(sentiment: Sentiment | null | undefined): boolean {
  return sentiment != null && NEGATIVE_SENTIMENTS.has(sentiment);
}

export function isStrongSentiment(sentiment: Sentiment | null | undefined): boolean {
  return sentiment != null && STRONG_SENTIMENTS.has(sentiment);
}

export enum Intent {
  Recommendation = "recommendation",
  IssueReport = "issue_report",
  Comparison = "comparison",
  ExperienceReport = "experience_report",
  Warning = "warning",
  SeekingAdvice = "seeking_advice",
  Question = "question",
  ReputationReport = "reputation_report",
}

export enum ExperienceType {
  Owner = "owner",
  PriorOwner = "prior_owner",
  Tested = "tested",
  ProspectiveBuyer = "prospective_buyer",
  Reference = "reference",
}

export enum Depth {
  Comprehensive = "comprehensive",
  Detailed = "detailed",
  Mentioned = "mentioned",
  Superficial = "superficial",
}
