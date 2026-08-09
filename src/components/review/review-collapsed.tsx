"use client";

import { Card, Group, Stack, Text } from "@mantine/core";
import { Review } from "@/models/review";
import { SentimentBadge, sentimentColor } from "@/components/sentiment-badge";

type Props = {
  review: Review;
};

export const ReviewCollapsed = ({ review }: Props) => {
  if (!review.quotes?.length) return null;

  return (
    <Card.Section withBorder inheritPadding py="xs">
      <Stack gap={4}>
        {review.quotes.map((quote, quoteIndex) => (
          <Group
            key={quoteIndex}
            gap="xs"
            wrap="nowrap"
            align="flex-start"
            style={{
              borderLeft: `3px solid ${sentimentColor(quote.sentiment)}`,
              paddingLeft: 8,
            }}
          >
            <SentimentBadge sentiment={quote.sentiment} size="xs" />
            <Text size="sm" fs="italic">
              &quot;{quote.text}&quot;
            </Text>
          </Group>
        ))}
      </Stack>
    </Card.Section>
  );
};
