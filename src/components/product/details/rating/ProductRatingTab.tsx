"use client";

import {
  Accordion,
  Badge,
  Blockquote,
  Card,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { isEmpty } from "lodash";
import { useAppSelector } from "@/store/store-hooks";
import { selectProduct } from "@/store/slices/product-slice";
import { ProductRatingBar } from "@/components/product/product-rating-bar";
import { ProductRating, ProductRatingHighlight } from "@/models/rating-types";

export const ProductRatingTab = () => {
  const product = useAppSelector(selectProduct);
  const rating = product?.rating;

  if (!rating) {
    return (
      <Card withBorder>
        <Text c="dimmed">No rating yet for this product.</Text>
      </Card>
    );
  }

  const hasAnalysis =
    !!rating.tldr ||
    !!rating.summary ||
    !isEmpty(rating.pros) ||
    !isEmpty(rating.cons);

  return (
    <Stack gap="lg">
      <RatingSummaryCard rating={rating} />
      {hasAnalysis ? (
        <ReviewAnalysisCard rating={rating} />
      ) : (
        <Card withBorder>
          <Text c="dimmed">
            No review analysis available yet. Queue one via the Actions drawer
            (&quot;Run review analysis&quot;).
          </Text>
        </Card>
      )}
    </Stack>
  );
};

function RatingSummaryCard({ rating }: { rating: ProductRating }) {
  return (
    <Card withBorder>
      <Title order={4} mb="sm">
        Rating
      </Title>
      <ProductRatingBar rating={rating} />
    </Card>
  );
}

function ReviewAnalysisCard({ rating }: { rating: ProductRating }) {
  const generatedAt = rating.lastSummaryGeneratedAt
    ? new Date(rating.lastSummaryGeneratedAt).toLocaleString()
    : null;

  return (
    <Card withBorder>
      <Group justify="space-between" align="flex-start" mb="sm">
        <Title order={4}>Review analysis</Title>
        {generatedAt && (
          <Text size="xs" c="dimmed">
            Generated {generatedAt}
            {rating.reviewCountAtLastSummary != null
              ? ` · ${rating.reviewCountAtLastSummary} reviews`
              : ""}
          </Text>
        )}
      </Group>

      <Stack gap="md">
        {rating.tldr && (
          <Text fw={600} size="md">
            {rating.tldr}
          </Text>
        )}

        {rating.summary && <Text>{rating.summary}</Text>}

        {(!isEmpty(rating.pros) || !isEmpty(rating.cons)) && (
          <Grid gutter="md">
            {!isEmpty(rating.pros) && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <HighlightAccordion
                  title="Pros"
                  color="green"
                  highlights={rating.pros ?? []}
                />
              </Grid.Col>
            )}
            {!isEmpty(rating.cons) && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <HighlightAccordion
                  title="Cons"
                  color="red"
                  highlights={rating.cons ?? []}
                />
              </Grid.Col>
            )}
          </Grid>
        )}
      </Stack>
    </Card>
  );
}

function HighlightAccordion({
  title,
  color,
  highlights,
}: {
  title: string;
  color: string;
  highlights: ProductRatingHighlight[];
}) {
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Badge color={color} variant="light">
          {title}
        </Badge>
        <Text size="xs" c="dimmed">
          {highlights.length}
        </Text>
      </Group>

      <Accordion multiple variant="separated" radius="sm">
        {highlights.map((highlight, index) => (
          <Accordion.Item
            key={`${title}-${index}`}
            value={`${title}-${index}`}
          >
            <Accordion.Control>
              <Text size="sm" fw={500}>
                {highlight.text}
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              {isEmpty(highlight.quotes) ? (
                <Text c="dimmed" size="sm">
                  No supporting quotes.
                </Text>
              ) : (
                <Stack gap="xs">
                  {highlight.quotes.map((quote, quoteIndex) => (
                    <Blockquote
                      key={quoteIndex}
                      color={color}
                      p="xs"
                      styles={{ root: { fontSize: 13 } }}
                    >
                      {quote}
                    </Blockquote>
                  ))}
                </Stack>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}


