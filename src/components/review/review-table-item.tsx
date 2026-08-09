"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  CopyButton,
  Group,
  Image,
  Loader,
  LoadingOverlay,
  Menu,
  Stack,
  Text,
} from "@mantine/core";
import { format } from "date-fns";
import { Review } from "@/models/review";
import { FaCopy, FaCheck, FaTimes, FaExternalLinkAlt } from "react-icons/fa";
import { PiDotsThree } from "react-icons/pi";
import { useAppDispatch } from "@/store/store-hooks";
import { updateReview } from "@/store/slices/review-slice";
import { useMemo, useState } from "react";
import { ColoredRating } from "../colored-rating";
import { ReviewCollapsed } from "./review-collapsed";
import { ReviewExpanded } from "./review-expanded";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { getReviewById } from "@/api-actions/review/get-review";
import { sentimentLabel } from "@/components/sentiment-badge";

type Props = {
  review: Review;
};

const SENTIMENT_COLORS: Record<string, string> = {
  strongPositive: "green",
  positive: "green",
  neutral: "gray",
  negative: "orange",
  strongNegative: "red",
  mixed: "blue",
};

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "orange",
  youtube: "red",
};

export const ReviewTableItem = ({ review }: Props) => {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);
  const [detailReview, setDetailReview] = useState<Review | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const borderColor = useMemo(() => {
    if (!review.enabled) return "red";
    if (review.deletedAt) return "red";
    return SENTIMENT_COLORS[review.sentiment] ?? "gray";
  }, [review.enabled, review.deletedAt, review.sentiment]);

  const onToggleEnabled = () => {
    dispatch(
      updateReview({
        id: review.id,
        dto: { enabled: !review.enabled },
      })
    );
  };

  const handleToggleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (detailReview) {
      setExpanded(true);
      return;
    }

    setExpanded(true);
    setDetailLoading(true);
    try {
      const detail = await getReviewById(review.id);
      setDetailReview(detail);
    } catch {
      // Fall back to search result data
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Stack key={review.id} pos="relative" pb={20}>
      <LoadingOverlay
        visible={review.loading || false}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <Card
        withBorder
        shadow="sm"
        padding="md"
        radius="sm"
        bd={`2px solid ${borderColor}`}
      >
        {/* Header */}
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <Group gap="sm">
              {review.model?.mainImage?.url && (
                <Image
                  src={review.model.mainImage.url}
                  alt={review.model.displayName}
                  w={120}
                  h={120}
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
              <Badge color="gray" variant="light" size="sm" tt="none">
                uid: {review.userId}
              </Badge>
            </Group>

            <Menu withinPortal position="bottom-end" shadow="sm">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <PiDotsThree size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <CopyButton value={review.id}>
                  {({ copied, copy }) => (
                    <Menu.Item
                      leftSection={<FaCopy size={14} />}
                      onClick={copy}
                    >
                      {copied ? "Copied" : `ID: ${review.id}`}
                    </Menu.Item>
                  )}
                </CopyButton>

                {review.model?.id && (
                  <Menu.Item
                    leftSection={<FaExternalLinkAlt size={14} />}
                    component={Link}
                    href={routes.products.details(review.model.id)}
                    target="_blank"
                  >
                    Product Details
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Card.Section>

        {/* Metadata */}
        <Card.Section withBorder inheritPadding py="xs">
          <Group gap="xs" wrap="wrap">
            <Button
              size="xs"
              variant="light"
              color={review.enabled ? "green" : "red"}
              onClick={onToggleEnabled}
              leftSection={
                review.enabled ? (
                  <FaCheck size={12} />
                ) : (
                  <FaTimes size={12} />
                )
              }
            >
              {review.enabled ? "enabled" : "disabled"}
            </Button>

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
              <Badge
                color={PLATFORM_COLORS[review.platform] ?? "gray"}
                variant="light"
                size="md"
                tt="none"
              >
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
                  "yyyy-MM-dd HH:mm:ss"
                )}
              </Badge>
            )}

            {review.createdAt && (
              <Badge color="gray" variant="light" size="sm" tt="none">
                created:{" "}
                {format(new Date(review.createdAt), "yyyy-MM-dd HH:mm:ss")}
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
        {expanded && (
          <ReviewExpanded
            review={detailReview ?? review}
            loading={detailLoading}
          />
        )}

        <Card.Section inheritPadding py="xs">
          <Button
            variant="subtle"
            size="xs"
            color="gray"
            onClick={handleToggleExpand}
            disabled={detailLoading}
            leftSection={
              detailLoading ? <Loader size={12} /> : undefined
            }
          >
            {detailLoading
              ? "Loading..."
              : expanded
                ? "← Collapse"
                : "Read full review →"}
          </Button>
        </Card.Section>
      </Card>
    </Stack>
  );
};
