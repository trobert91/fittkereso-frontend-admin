import { Badge, Tooltip } from "@mantine/core";
import { Evidence, Quote, effectiveSentiment } from "@/models/thread-extraction-models";
import { Sentiment } from "@/models/enums/review-enums";

const SENTIMENT_COLORS: Record<Sentiment, string> = {
  [Sentiment.StrongPositive]: "green",
  [Sentiment.Positive]: "green",
  [Sentiment.Neutral]: "gray",
  [Sentiment.Negative]: "red",
  [Sentiment.StrongNegative]: "red",
  [Sentiment.Mixed]: "blue",
};

const SENTIMENT_PREFIX: Record<Sentiment, string> = {
  [Sentiment.StrongPositive]: "++",
  [Sentiment.Positive]: "+",
  [Sentiment.Neutral]: "",
  [Sentiment.Negative]: "-",
  [Sentiment.StrongNegative]: "--",
  [Sentiment.Mixed]: "±",
};

interface EvidenceBadgeProps {
  value: Evidence;
  /** Quote that contains this evidence — its sentiment is used as the fallback.
   *  Omit for reference-level evidence, which always carries its own sentiment. */
  quote?: Quote;
  /** "feature" / "issue" render lowercase, "useCase" uppercase. Issues render filled to stand out. */
  kind: "feature" | "useCase" | "issue";
  size?: string;
}

export function EvidenceBadge({ value, quote, kind, size = "md" }: EvidenceBadgeProps) {
  const sentiment = quote
    ? effectiveSentiment(value, quote)
    : value.sentiment ?? Sentiment.Neutral;
  const color = kind === "issue" ? "red" : SENTIMENT_COLORS[sentiment];
  const prefix = kind === "issue" ? "" : SENTIMENT_PREFIX[sentiment];
  const tt = kind === "useCase" ? "uppercase" : "lowercase";
  const variant = kind === "issue" ? "filled" : "outline";

  const tooltipParts: string[] = [sentiment];
  if (quote && value.sentiment && value.sentiment !== quote.sentiment) {
    tooltipParts.push("(overrides quote sentiment)");
  }
  if (value.issueType) tooltipParts.push(`(issue: ${value.issueType})`);
  const tooltip = tooltipParts.join(" ");

  const badge = (
    <Badge size={size} variant={variant} tt={tt} color={color}>
      {prefix ? `${prefix} ` : ""}
      {value.label}
      {value.issueType ? `: ${value.issueType}` : ""}
    </Badge>
  );

  return (
    <Tooltip label={tooltip} withArrow>
      {badge}
    </Tooltip>
  );
}
