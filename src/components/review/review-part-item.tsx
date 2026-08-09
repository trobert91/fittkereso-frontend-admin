"use client";

import { Badge, Group, Image, Stack, Text } from "@mantine/core";
import { ProductReference } from "@/models/product-reference";
import { getPrimaryModel } from "@/models/product-reference-helpers";
import { ColoredRating } from "../colored-rating";
import { FaExternalLinkAlt } from "react-icons/fa";
import Link from "next/link";
import { useMemo } from "react";
import { SanitizedHtml } from "../sanitized-html";
import { CommentThreadTree } from "../comment/comment-thread-tree";
import { SentimentBadge, sentimentColor, sentimentLabel } from "@/components/sentiment-badge";

type Props = {
  productRef: ProductReference;
  index: number;
};

const PLATFORM_BASE_URLS: Record<string, string> = {
  reddit: 'https://www.reddit.com',
  youtube: 'https://www.youtube.com',
};

const resolveUrl = (url: string | undefined, source: string | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = source ? (PLATFORM_BASE_URLS[source] ?? null) : null;
  return base ? `${base}${url}` : url;
};

const SENTIMENT_COLORS: Record<string, string> = {
  strongPositive: "green",
  positive: "green",
  neutral: "gray",
  negative: "orange",
  strongNegative: "red",
  mixed: "blue",
};

export const ReviewPartItem = ({ productRef, index }: Props) => {
  const comment = productRef.comment;
  const thread = comment?.thread;
  const refSentimentColor =
    SENTIMENT_COLORS[productRef.sentiment ?? ""] ?? "gray";
  const resolvedModel = getPrimaryModel(productRef);

  // Highlight quotes in the comment body
  const highlightedBody = useMemo(() => {
    if (!comment?.body || !productRef.quotes?.length) {
      return comment?.body ? <SanitizedHtml html={comment.body} /> : null;
    }

    const body = comment.body;
    const quotes = [...productRef.quotes].sort(
      (a, b) => b.text.length - a.text.length
    );

    const highlights: { start: number; end: number; sentiment: string }[] = [];

    for (const quote of quotes) {
      const lowerBody = body.toLowerCase();
      const lowerQuote = quote.text.toLowerCase();
      const position = lowerBody.indexOf(lowerQuote);
      if (position === -1) continue;

      const end = position + quote.text.length;
      const overlaps = highlights.some(
        (highlight) => position < highlight.end && end > highlight.start
      );
      if (overlaps) continue;

      highlights.push({ start: position, end, sentiment: quote.sentiment });
    }

    if (highlights.length === 0) {
      return <SanitizedHtml html={body} />;
    }

    highlights.sort((a, b) => a.start - b.start);

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const highlight of highlights) {
      if (highlight.start > lastIndex) {
        parts.push(
          <SanitizedHtml
            inline
            key={`text-${lastIndex}`}
            html={body.slice(lastIndex, highlight.start)}
          />
        );
      }

      const bgColors: Record<string, string> = {
        strongPositive: "rgba(64, 192, 87, 0.25)",
        positive: "rgba(64, 192, 87, 0.15)",
        neutral: "rgba(134, 142, 150, 0.15)",
        negative: "rgba(255, 146, 43, 0.15)",
        strongNegative: "rgba(250, 82, 82, 0.25)",
        mixed: "rgba(77, 171, 247, 0.15)",
      };

      parts.push(
        <span
          key={`highlight-${highlight.start}`}
          style={{
            backgroundColor: bgColors[highlight.sentiment] ?? bgColors.neutral,
            borderRadius: 2,
            padding: "1px 2px",
          }}
        >
          <SanitizedHtml inline html={body.slice(highlight.start, highlight.end)} />
        </span>
      );

      lastIndex = highlight.end;
    }

    if (lastIndex < body.length) {
      parts.push(
        <SanitizedHtml inline key={`text-${lastIndex}`} html={body.slice(lastIndex)} />
      );
    }

    return <>{parts}</>;
  }, [comment, productRef.quotes]);

  return (
    <Stack gap="xs">
      {/* Part header */}
      <Group gap="xs" wrap="wrap" align="center">
        {resolvedModel?.mainImage?.url && (
          <Image
            src={resolvedModel.mainImage.url}
            alt={resolvedModel.displayName}
            w={40}
            h={40}
            fit="contain"
            radius="sm"
          />
        )}
        <Badge color="gray" variant="light" size="sm" tt="none">
          Part {index + 1}
        </Badge>
        {thread?.title && (
          <Text size="sm" fw={500}>
            {thread.title}
          </Text>
        )}
        {comment?.url && (
          <Link href={resolveUrl(comment.url, thread?.source) ?? comment.url} target="_blank" rel="noopener noreferrer">
            <FaExternalLinkAlt size={10} />
          </Link>
        )}
        {thread?.url && comment?.url !== thread.url && (
          <Link href={resolveUrl(thread.url, thread?.source) ?? thread.url} target="_blank" rel="noopener noreferrer">
            <Badge color="gray" variant="light" size="xs" tt="none">
              thread
            </Badge>
          </Link>
        )}
      </Group>

      {/* Part badges */}
      <Group gap="xs" wrap="wrap">
        {productRef.sentiment && (
          <Badge color={refSentimentColor} variant="light" size="sm" tt="none">
            {sentimentLabel(productRef.sentiment)}
          </Badge>
        )}
        {productRef.experience && (
          <Badge color="teal" variant="light" size="sm" tt="none">
            {productRef.experience.split("_").join(" ")}
          </Badge>
        )}
        {productRef.depth && (
          <Badge color="violet" variant="light" size="sm" tt="none">
            {productRef.depth}
          </Badge>
        )}
        {productRef.intents?.map((intent) => (
          <Badge key={intent} color="blue" variant="light" size="sm" tt="none">
            {intent.split("_").join(" ")}
          </Badge>
        ))}
        <ColoredRating
          value={productRef.relevance ?? 0}
          size={40}
          thickness={4}
        />
        {comment && (
          <>
            <Badge color="gray" variant="light" size="sm" tt="none">
              {"\u25B2"} {comment.upvotes ?? 0}
            </Badge>
            <Badge color="gray" variant="light" size="sm" tt="none">
              {"\u25BC"} {comment.downvotes ?? 0}
            </Badge>
          </>
        )}
        {!productRef.enabled && (
          <Badge color="red" variant="light" size="sm" tt="none">
            disabled
          </Badge>
        )}
        {productRef.flagged && (
          <Badge color="red" variant="filled" size="sm" tt="none">
            flagged
          </Badge>
        )}
      </Group>

      {/* Comment thread tree with highlighted body */}
      {comment?.body && (
        <CommentThreadTree comment={comment}>
          {highlightedBody}
        </CommentThreadTree>
      )}

      {/* Quotes list if no body match */}
      {productRef.quotes && productRef.quotes.length > 0 && !comment?.body && (
        <Stack gap={4}>
          {productRef.quotes.map((quote, quoteIndex) => (
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
      )}
    </Stack>
  );
};
