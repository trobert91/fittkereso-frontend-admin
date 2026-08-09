"use client";

import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  LoadingOverlay,
  Menu,
  Modal,
  Stack,
  Text,
  Timeline,
  ThemeIcon,
  CopyButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { format } from "date-fns";
import { CommentStatus } from "@/models/enums/comment-enums";
import { UserComment } from "@/models/user-comment";
import { CommentModeration } from "@/models/comment-moderation";
import { ProductReferenceUpdatePayload } from "@/models/product-reference";
import { getPrimaryModel } from "@/models/product-reference-helpers";
import { mapReferenceToDto } from "@/models/dtos/map-reference-to-dto";
import {
  FaEdit,
  FaExternalLinkAlt,
  FaEye,
  FaRedo,
  FaSave,
  FaUndo,
  FaCheck,
  FaTimes,
  FaCopy,
  FaHistory,
} from "react-icons/fa";
import { CommentTimeline } from "./comment-timeline";
import { ValidationIssuesModal } from "./validation-issues-modal";
import { SanitizedHtml } from "../sanitized-html";
import { CommentTableProductReferenceItem } from "./comment-product-reference";
import { CommentMediaList } from "./comment-media-list";
import { useMemo, useState } from "react";
import { PiDotsThree } from "react-icons/pi";
import { MdRateReview } from "react-icons/md";
import { useAppDispatch } from "@/store/store-hooks";
import {
  undoCommentChanges,
  updateComment,
  toggleCommentChecked,
  retryComment,
  updateCommentStatus,
} from "@/store/slices/comment-slice";
import { isEmpty, orderBy } from "lodash";
import { ScoreRing } from "../score-ring";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/auth-slice";

const SENTIMENT_COLORS: Record<string, string> = {
  strongPositive: "green",
  positive: "green",
  neutral: "gray",
  negative: "red",
  strongNegative: "red",
  mixed: "blue",
};

const commentStatusColor = (status: CommentStatus | undefined): string => {
  switch (status) {
    case CommentStatus.NEW:
    case CommentStatus.IDENTIFIED:
    case CommentStatus.RELEVANCE_CALCULATED:
    case CommentStatus.PLANNED:
    case CommentStatus.EXTRACTED:
    case CommentStatus.RESOLVED:
    case CommentStatus.REFINEMENT:
    case CommentStatus.SKIPPED:
      return "grey";
    case CommentStatus.VALIDATED:
    case CommentStatus.RELEVANCE_FINALIZED:
      return "teal";
    case CommentStatus.IN_REVIEW:
      return "blue";
    case CommentStatus.APPROVED:
      return "green";
    case CommentStatus.DELETED:
      return "red";
    default:
      return "grey";
  }
};

type Props = {
  comment: UserComment;
  hideParentThread?: boolean;
  onUndoChanges?: (payload: { id: string }) => void;
  onChangeProductReference?: (payload: {
    commentId: string;
    productReference: ProductReferenceUpdatePayload;
  }) => void;
};

export const CommentTableItem = ({
  comment,
  hideParentThread,
  onUndoChanges,
  onChangeProductReference,
}: Props) => {
  const dispatch = useAppDispatch();
  const user = useSelector(selectUser);

  const statusColor = useMemo(
    () =>
      comment.originalState ? "yellow" : commentStatusColor(comment.status),
    [comment.originalState, comment.status],
  );

  const onSave = () => {
    if (comment.productReferences && !isEmpty(comment.productReferences)) {
      dispatch(
        updateComment({
          id: comment.id,
          dto: {
            productReferences: comment.productReferences.map(mapReferenceToDto),
          },
        }),
      )
        .unwrap()
        .catch((err: string) => {
          notifications.show({
            title: "Failed to update comment",
            message: err,
            color: "red",
          });
        });
    }
  };

  const onRevert = () => {
    if (onUndoChanges) {
      onUndoChanges({ id: comment.id });
    } else {
      dispatch(undoCommentChanges({ id: comment.id }));
    }
  };

  const onToggleChecked = () => {
    dispatch(toggleCommentChecked({ id: comment.id }));
  };

  const isCheckedByCurrentUser = useMemo(
    () => comment.checkedByUserId?.includes(user?.id ?? ""),
    [comment.checkedByUserId, user?.id],
  );

  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const onConfirmRetry = () => {
    setRetryLoading(true);
    dispatch(retryComment({ id: comment.id }))
      .unwrap()
      .then(() => {
        notifications.show({
          title: "Retry queued",
          message: "Comment will be reprocessed shortly.",
          color: "green",
        });
        setRetryModalOpen(false);
      })
      .catch((err: string) => {
        notifications.show({
          title: "Retry failed",
          message: err,
          color: "red",
        });
      })
      .finally(() => {
        setRetryLoading(false);
      });
  };

  const orderedReferences = useMemo(() => {
    if (!comment.productReferences) return [];

    return orderBy(
      [...comment.productReferences],
      [(ref) => ref.relevance ?? 0],
      ["desc"],
    );
  }, [comment.productReferences]);

  const commentIssuesWithSource = useMemo(() => {
    const refRows = orderedReferences.flatMap((ref) => {
      const issues = ref.context?.issues ?? [];
      const primaryModel = getPrimaryModel(ref);
      const sourceLabel =
        primaryModel?.displayName ??
        primaryModel?.model ??
        ref.context?.identification?.displayName ??
        ref.context?.identification?.model ??
        `ref ${ref.id.slice(0, 6)}`;
      const sourceColor = SENTIMENT_COLORS[ref.sentiment ?? ""] ?? "gray";
      return issues.map((issue) => ({ issue, sourceLabel, sourceColor }));
    });
    const commentLevelRows = (comment.context?.issues ?? []).map((issue) => ({
      issue,
      sourceLabel: "comment",
      sourceColor: "blue",
    }));
    return [...commentLevelRows, ...refRows];
  }, [orderedReferences, comment.context?.issues]);

  return (
    <Stack key={comment.id} pos="relative" pb={60}>
      <LoadingOverlay
        visible={comment.loading || false}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <Card
        withBorder
        shadow="sm"
        padding="md"
        radius="sm"
        bd={`2px solid ${statusColor}`}
      >
        <Card.Section
          inheritPadding
          py="sm"
          bg={`var(--mantine-color-${statusColor}-light)`}
        >
          <Group justify="space-between">
            <Group>
              <CommentStatusMenu
                comment={comment}
                statusColor={statusColor}
                onChange={(status) =>
                  dispatch(updateCommentStatus({ id: comment.id, status }))
                }
              />

              {comment.relevance != null && (
                <ScoreRing
                  rate={comment.relevance}
                  size={30}
                  thickness={4}
                  tooltip={`relevance: ${comment.relevance}`}
                />
              )}

              <Button
                onClick={onToggleChecked}
                size="compact-xs"
                color={statusColor}
                variant={isCheckedByCurrentUser ? "filled" : "outline"}
                disabled={comment.originalState !== undefined}
                leftSection={
                  isCheckedByCurrentUser ? (
                    <FaCheck size={10} />
                  ) : (
                    <FaTimes size={10} />
                  )
                }
              >
                {isCheckedByCurrentUser ? "checked" : "unchecked"}
              </Button>

              {!hideParentThread && comment.thread?.title && (
                <Badge color="gray" variant="light" size="sm" tt="none">
                  {comment.thread.title}
                </Badge>
              )}

              <Group gap={4}>
                {(commentIssuesWithSource.length > 0 ||
                  (comment.moderationPriority != null &&
                    comment.moderationPriority > 1)) && (
                  <ValidationIssuesModal
                    issuesWithSource={commentIssuesWithSource}
                    issueSeverity={comment.issueSeverity}
                    openIssueSeverity={comment.openIssueSeverity}
                    moderationPriority={comment.moderationPriority}
                  />
                )}
              </Group>

              {comment.createdAt && (
                <Badge color="gray" variant="light" size="sm" tt="none">
                  created: {format(new Date(comment.createdAt), "yyyy-MM-dd")}
                </Badge>
              )}
              {comment.updatedAt && (
                <Badge color="gray" variant="light" size="sm" tt="none">
                  updated: {format(new Date(comment.updatedAt), "yyyy-MM-dd")}
                </Badge>
              )}

              {comment.reviewConfidence && (
                <Badge color={statusColor} variant="light" size="sm" tt="none">
                  reviewConfidence: {comment.reviewConfidence}
                </Badge>
              )}
              {comment.validated && (
                <Badge color="green" variant="light" size="sm" tt="none">
                  validated
                </Badge>
              )}

              {comment.moderations && comment.moderations.length > 0 && (
                <Button
                  size="compact-xs"
                  variant="light"
                  color="gray"
                  leftSection={<FaHistory size={10} />}
                  onClick={() => setHistoryModalOpen(true)}
                >
                  history
                </Button>
              )}
            </Group>

            <Menu withinPortal position="bottom-end" shadow="sm">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <PiDotsThree size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {comment.thread && (
                  <Menu.Item
                    leftSection={<FaEdit size={14} />}
                    component={Link}
                    href={routes.threads.details(comment.thread.id)}
                    target="_blank"
                  >
                    Thread Details
                  </Menu.Item>
                )}
                {comment.url && (
                  <Menu.Item
                    leftSection={<FaEye size={14} />}
                    component="a"
                    href={
                      comment.url.startsWith("http")
                        ? comment.url
                        : `https://www.reddit.com${comment.url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Go to comment
                  </Menu.Item>
                )}
                <Menu.Item
                  leftSection={<FaRedo size={14} />}
                  onClick={() => setRetryModalOpen(true)}
                >
                  Retry
                </Menu.Item>

                {comment.thread?.url && (
                  <Menu.Item
                    leftSection={<FaExternalLinkAlt size={14} />}
                    component={Link}
                    href={comment.thread.url}
                    target="_blank"
                  >
                    Go to thread
                  </Menu.Item>
                )}
                <CopyButton value={comment.id}>
                  {({ copied, copy }) => (
                    <Menu.Item
                      leftSection={<FaCopy size={14} />}
                      onClick={copy}
                    >
                      {copied ? "Copied" : `ID: ${comment.id}`}
                    </Menu.Item>
                  )}
                </CopyButton>
                {comment.thread && (
                  <CopyButton value={comment.thread.id}>
                    {({ copied, copy }) => (
                      <Menu.Item
                        leftSection={<FaCopy size={14} />}
                        onClick={copy}
                      >
                        {copied ? "Copied" : `Thread ID: ${comment.thread.id}`}
                      </Menu.Item>
                    )}
                  </CopyButton>
                )}
                {comment.externalId && (
                  <CopyButton value={comment.externalId}>
                    {({ copied, copy }) => (
                      <Menu.Item
                        leftSection={<FaCopy size={14} />}
                        onClick={copy}
                      >
                        {copied ? "Copied" : `External ID: ${comment.externalId}`}
                      </Menu.Item>
                    )}
                  </CopyButton>
                )}
                {!hideParentThread && comment.parent?.externalId && (
                  <CopyButton value={comment.parent.externalId}>
                    {({ copied, copy }) => {
                      const parentExternalId = comment.parent?.externalId;
                      return (
                        <Menu.Item
                          leftSection={<FaCopy size={14} />}
                          onClick={copy}
                        >
                          {copied
                            ? "Copied"
                            : `Parent External ID: ${parentExternalId}`}
                        </Menu.Item>
                      );
                    }}
                  </CopyButton>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Card.Section>

        <Card.Section withBorder inheritPadding py="md">
              {hideParentThread ? (
                <TruncatableCommentBody body={comment.body} />
              ) : (
                <CommentTimeline comment={comment} />
              )}
            </Card.Section>

            {comment.media?.some((m) => m.url || m.content) && (
              <Card.Section withBorder inheritPadding py="sm">
                <CommentMediaList media={comment.media} />
              </Card.Section>
            )}

            <Card.Section withBorder inheritPadding py="md">
              {comment.productReferences &&
                comment.productReferences.length > 0 && (
                  <Stack gap="sm">
                    {orderedReferences.map((productRef) => (
                      <CommentTableProductReferenceItem
                        statusColor={statusColor}
                        commentId={comment.id}
                        commentBody={comment.body}
                        productRef={productRef}
                        key={productRef.id}
                        onChangeProductReference={onChangeProductReference}
                      />
                    ))}
                  </Stack>
                )}
            </Card.Section>

            {comment.originalState && (
              <Card.Section withBorder inheritPadding py="sm">
                <Group justify="center" gap="sm" grow>
                  <Button
                    onClick={onSave}
                    color="blue"
                    size="sm"
                    leftSection={<FaSave size={12} />}
                  >
                    Save
                  </Button>
                  <Button
                    onClick={onRevert}
                    color="red"
                    variant="outline"
                    size="sm"
                    leftSection={<FaUndo size={12} />}
                  >
                    Revert
                  </Button>
                </Group>
              </Card.Section>
            )}
      </Card>

      <CommentHistoryModal
        opened={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        moderations={comment.moderations ?? []}
      />

      <Modal
        opened={retryModalOpen}
        onClose={() => setRetryModalOpen(false)}
        title="Retry comment processing"
        size="sm"
      >
        <Text size="sm" mb="md">
          Reset this comment&apos;s processing state and queue the thread for
          reprocessing? All extracted data for this comment will be cleared.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button
            variant="default"
            onClick={() => setRetryModalOpen(false)}
            disabled={retryLoading}
          >
            Cancel
          </Button>
          <Button
            color="orange"
            loading={retryLoading}
            onClick={onConfirmRetry}
          >
            Confirm retry
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
};


const BODY_TRUNCATE_LIMIT = 400;

const TruncatableCommentBody = ({ body }: { body: string }) => {
  const [expanded, setExpanded] = useState(false);
  const isTruncatable = body.length > BODY_TRUNCATE_LIMIT;

  return (
    <Text
      component="div"
      size="sm"
      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
    >
      {isTruncatable && !expanded ? (
        <>
          {body.slice(0, BODY_TRUNCATE_LIMIT) + "…"}{" "}
          <Anchor
            component="button"
            size="sm"
            c="blue"
            onClick={() => setExpanded(true)}
          >
            Show more
          </Anchor>
        </>
      ) : (
        <>
          <SanitizedHtml html={body} />
          {isTruncatable && (
            <>
              {" "}
              <Anchor
                component="button"
                size="sm"
                c="blue"
                onClick={() => setExpanded(false)}
              >
                Show less
              </Anchor>
            </>
          )}
        </>
      )}
    </Text>
  );
};

const MODERATION_STATUSES: CommentStatus[] = [
  CommentStatus.IN_REVIEW,
  CommentStatus.APPROVED,
  CommentStatus.DELETED,
];

const TRANSITIONABLE_FROM: ReadonlySet<CommentStatus> = new Set([
  CommentStatus.SKIPPED,
  CommentStatus.VALIDATED,
  CommentStatus.RELEVANCE_FINALIZED,
  CommentStatus.IN_REVIEW,
  CommentStatus.APPROVED,
  CommentStatus.DELETED,
]);

const humanizeStatus = (status: CommentStatus): string =>
  status.split("_").join(" ").toLowerCase();

const CommentStatusMenu = ({
  comment,
  statusColor,
  onChange,
}: {
  comment: UserComment;
  statusColor: string;
  onChange: (status: CommentStatus) => void;
}) => {
  const disabled =
    comment.originalState !== undefined ||
    !TRANSITIONABLE_FROM.has(comment.status);

  const button = (
    <Button
      size="compact-xs"
      variant="light"
      color={statusColor}
      disabled={disabled}
      style={{ textTransform: "none" }}
    >
      {humanizeStatus(comment.status)}
    </Button>
  );

  if (disabled) return button;

  return (
    <Menu shadow="sm" position="bottom-start" withinPortal>
      <Menu.Target>{button}</Menu.Target>
      <Menu.Dropdown>
        {MODERATION_STATUSES.map((status) => (
          <Menu.Item
            key={status}
            onClick={() => onChange(status)}
            disabled={status === comment.status}
          >
            {humanizeStatus(status)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

const CommentHistoryModal = ({
  opened,
  onClose,
  moderations,
}: {
  opened: boolean;
  onClose: () => void;
  moderations: CommentModeration[];
}) => (
  <Modal opened={opened} onClose={onClose} title="History" size="lg">
    {moderations.length === 0 ? (
      <Text size="sm" c="dimmed">
        No history.
      </Text>
    ) : (
      <Timeline bulletSize={18} lineWidth={2}>
        {[...moderations].reverse().map((moderation, index) => {
          const sourceColor =
            moderation.source === "validation_llm"
              ? moderation.suggestedStatus === "deleted"
                ? "red"
                : "violet"
              : moderation.source === "admin"
              ? "blue"
              : "gray";
          const sourceLabel =
            moderation.source === "validation_llm"
              ? "LLM"
              : moderation.source === "admin"
              ? "Admin"
              : "System";
          return (
            <Timeline.Item
              key={`${moderation.createdAt}-${index}`}
              bullet={
                <ThemeIcon
                  size={18}
                  radius="xl"
                  color={sourceColor}
                  variant="filled"
                >
                  <MdRateReview size={10} />
                </ThemeIcon>
              }
              title={
                <Group gap={6} wrap="nowrap" align="center">
                  <Badge color={sourceColor} variant="light" size="xs" tt="none">
                    {sourceLabel}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {moderation.reviewedBy}
                  </Text>
                  {moderation.suggestedStatus && (
                    <Badge
                      color={commentStatusColor(
                        moderation.suggestedStatus as CommentStatus,
                      )}
                      variant="light"
                      size="xs"
                      tt="none"
                    >
                      → {moderation.suggestedStatus}
                    </Badge>
                  )}
                  <Text
                    size="xs"
                    c="dimmed"
                    style={{ marginLeft: "auto" }}
                  >
                    {format(new Date(moderation.createdAt), "yyyy-MM-dd HH:mm")}
                  </Text>
                </Group>
              }
            >
              {moderation.reviewComment && (
                <Text size="xs" c="dimmed" mt={2}>
                  {moderation.reviewComment}
                </Text>
              )}
            </Timeline.Item>
          );
        })}
      </Timeline>
    )}
  </Modal>
);
