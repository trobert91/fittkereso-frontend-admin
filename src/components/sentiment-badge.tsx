import { Badge, MantineSize } from "@mantine/core";
import { Sentiment } from "@/models/enums/review-enums";

const SENTIMENT_COLORS: Record<Sentiment, string> = {
  [Sentiment.StrongPositive]: "#1b5e20",
  [Sentiment.Positive]: "green",
  [Sentiment.Neutral]: "gray",
  [Sentiment.Negative]: "orange",
  [Sentiment.StrongNegative]: "red",
  [Sentiment.Mixed]: "blue",
};

const SENTIMENT_LABELS: Record<Sentiment, string> = {
  [Sentiment.StrongPositive]: "strong +",
  [Sentiment.Positive]: "positive",
  [Sentiment.Neutral]: "neutral",
  [Sentiment.Negative]: "negative",
  [Sentiment.StrongNegative]: "strong -",
  [Sentiment.Mixed]: "mixed",
};

export const sentimentColor = (sentiment: Sentiment): string =>
  SENTIMENT_COLORS[sentiment] ?? "gray";

export const sentimentLabel = (sentiment: Sentiment): string =>
  SENTIMENT_LABELS[sentiment] ?? sentiment;

interface SentimentBadgeProps {
  sentiment: Sentiment;
  size?: MantineSize;
  variant?: "filled" | "light" | "outline" | "dot";
}

export function SentimentBadge({
  sentiment,
  size = "sm",
  variant = "filled",
}: SentimentBadgeProps) {
  return (
    <Badge
      color={sentimentColor(sentiment)}
      variant={variant}
      size={size}
      tt="none"
    >
      {sentimentLabel(sentiment)}
    </Badge>
  );
}
