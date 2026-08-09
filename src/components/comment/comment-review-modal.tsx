"use client";

import {
  Badge,
  Button,
  Card,
  CopyButton,
  Group,
  Image,
  LoadingOverlay,
  Menu,
  Modal,
  Text,
} from "@mantine/core";
import { FaCopy } from "react-icons/fa";
import { PiDotsThree } from "react-icons/pi";
import { format } from "date-fns";
import { Review } from "@/models/review";
import { useEffect, useState } from "react";
import { ColoredRating } from "../colored-rating";
import { ReviewCollapsed } from "../review/review-collapsed";
import { ReviewExpanded } from "../review/review-expanded";
import { getReviewById } from "@/api-actions/review/get-review";
import { sentimentLabel } from "@/components/sentiment-badge";

type Props = {
  reviewId: string;
  opened: boolean;
  onClose: () => void;
};

const SENTIMENT_COLORS: Record<string, string> = {
  strongPositive: "green",
  positive: "green",
  neutral: "gray",
  negative: "orange",
  strongNegative: "red",
  mixed: "blue",
};

export const CommentReviewModal = ({ reviewId, opened, onClose }: Props) => {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!opened || review) return;

    setLoading(true);
    getReviewById(reviewId)
      .then((detail) => setReview(detail))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [opened, reviewId, review]);

  const handleToggleExpand = () => {
    setExpanded((previous) => !previous);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Review Details"
      size="90%"
    >
      {loading && (
        <LoadingOverlay
          visible
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
        />
      )}

      {review && (
        <Card withBorder shadow="sm" padding="md" radius="sm">
          {/* Header */}
          <Card.Section withBorder inheritPadding py="xs">
            <Group gap="sm">
              {review.model?.mainImage?.url && (
                <Image
                  src={review.model.mainImage.url}
                  alt={review.model.displayName}
                  w={80}
                  h={80}
                  fit="contain"
                  radius="sm"
                />
              )}
              <Text fw={600} size="lg">
                {review.model?.displayName ?? "Unknown Product"}
              </Text>
              {review.model?.brand?.name && (
                <Badge color="gray" variant="light" size="md" tt="none">
                  {review.model.brand.name}
                </Badge>
              )}
              <Badge color="blue" variant="light" size="md" tt="none">
                {review.username}
              </Badge>

              <Menu shadow="sm" width={300}>
                <Menu.Target>
                  <Button
                    size="sm"
                    variant="light"
                    color="gray"
                    leftSection={<PiDotsThree size={16} />}
                  >
                    options
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <CopyButton value={review.id}>
                    {({ copied, copy }) => (
                      <Menu.Item
                        leftSection={<FaCopy size={12} />}
                        onClick={copy}
                      >
                        {copied ? "Copied" : `ID: ${review.id}`}
                      </Menu.Item>
                    )}
                  </CopyButton>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Card.Section>

          {/* Metadata */}
          <Card.Section withBorder inheritPadding py="xs">
            <Group gap="xs" wrap="wrap">
              <Badge
                color={SENTIMENT_COLORS[review.sentiment] ?? "gray"}
                variant="light"
                size="md"
                tt="none"
              >
                {sentimentLabel(review.sentiment)}
              </Badge>

              <Badge color="teal" variant="light" size="md" tt="none">
                {review.experience?.split("_").join(" ")}
              </Badge>

              {review.depth && (
                <Badge color="violet" variant="light" size="md" tt="none">
                  {review.depth}
                </Badge>
              )}

              {review.intents?.map((intent) => (
                <Badge
                  key={intent}
                  color="blue"
                  variant="light"
                  size="md"
                  tt="none"
                >
                  {intent.split("_").join(" ")}
                </Badge>
              ))}

              {review.platform && (
                <Badge color="gray" variant="light" size="md" tt="none">
                  {review.platform}
                </Badge>
              )}

              <ColoredRating
                value={review.reviewScore ?? null}
                size={50}
                thickness={6}
              />

              <Badge color="gray" variant="light" size="md" tt="none">
                parts: {review.partCount ?? 0}
              </Badge>

              <Badge color="gray" variant="light" size="md" tt="none">
                quotes: {review.totalQuoteCount ?? 0}
              </Badge>

              <Badge color="gray" variant="light" size="md" tt="none">
                {"\u25B2"} {review.totalUpvotes ?? 0}
              </Badge>

              <Badge color="gray" variant="light" size="md" tt="none">
                {"\u25BC"} {review.totalDownvotes ?? 0}
              </Badge>

              {review.externalCreationTs && (
                <Badge color="gray" variant="light" size="sm" tt="none">
                  ext:{" "}
                  {format(
                    new Date(review.externalCreationTs),
                    "yyyy-MM-dd HH:mm:ss",
                  )}
                </Badge>
              )}

              {review.deletedAt && (
                <Badge color="red" variant="filled" size="md" tt="none">
                  deleted:{" "}
                  {format(new Date(review.deletedAt), "yyyy-MM-dd HH:mm:ss")}
                </Badge>
              )}
            </Group>
          </Card.Section>

          {/* Collapsed: quotes preview */}
          {!expanded && <ReviewCollapsed review={review} />}

          {/* Expanded: full parts with thread trees */}
          {expanded && <ReviewExpanded review={review} loading={false} />}

          <Card.Section inheritPadding py="xs">
            <Button
              variant="subtle"
              size="xs"
              color="gray"
              onClick={handleToggleExpand}
            >
              {expanded ? "\u2190 Collapse" : "Read full review \u2192"}
            </Button>
          </Card.Section>
        </Card>
      )}
    </Modal>
  );
};
