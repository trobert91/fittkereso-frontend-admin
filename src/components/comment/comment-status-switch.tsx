import { CommentStatus } from "@/models/enums/comment-enums";
import { UserComment } from "@/models/user-comment";
import { SegmentedControl, Center } from "@mantine/core";
import { useMemo, useCallback } from "react";
import { useAppDispatch } from "@/store/store-hooks";
import { updateCommentStatus } from "@/store/slices/comment-slice";
import {
  TbProgress,
  TbProgressAlert,
  TbProgressBolt,
  TbProgressX,
} from "react-icons/tb";

export const CommentStatusSwitch = ({ comment }: { comment: UserComment }) => {
  const dispatch = useAppDispatch();

  const color = useMemo(() => {
    switch (comment.status) {
      case CommentStatus.IN_REVIEW:
        return "blue";
      case CommentStatus.APPROVED:
        return "green";
      case CommentStatus.DELETED:
        return "red";
      default:
        return "gray";
    }
  }, [comment.status]);

  const statuses = useMemo(() => {
    const statusList = [];

    if (
      [
        CommentStatus.NEW,
        CommentStatus.IDENTIFIED,
        CommentStatus.RELEVANCE_CALCULATED,
        CommentStatus.PLANNED,
        CommentStatus.EXTRACTED,
        CommentStatus.RESOLVED,
        CommentStatus.VALIDATED,
        CommentStatus.RELEVANCE_FINALIZED,
        CommentStatus.REFINEMENT,
        CommentStatus.SKIPPED,
      ].includes(comment.status)
    ) {
      statusList.push({
        value: comment.status,
        disabled: true,
        label: (
          <Center style={{ gap: 10 }}>
            <TbProgressAlert size={16} />
            <span>{comment.status.split("_").join(" ").toLowerCase()}</span>
          </Center>
        ),
      });
    }

    statusList.push(
      {
        value: CommentStatus.IN_REVIEW,
        label: (
          <Center style={{ gap: 10 }}>
            <TbProgress size={16} />
            <span>in review</span>
          </Center>
        ),
      },
      {
        value: CommentStatus.APPROVED,
        label: (
          <Center style={{ gap: 10 }}>
            <TbProgressBolt size={16} />
            <span>approved</span>
          </Center>
        ),
      },
      {
        value: CommentStatus.DELETED,
        label: (
          <Center style={{ gap: 10 }}>
            <TbProgressX size={16} />
            <span>deleted</span>
          </Center>
        ),
      },
    );

    return statusList;
  }, [comment.status]);

  const isDisabled = useMemo(() => {
    if (comment.originalState) {
      return true;
    }

    switch (comment.status) {
      case CommentStatus.SKIPPED:
      case CommentStatus.VALIDATED:
      case CommentStatus.RELEVANCE_FINALIZED:
      case CommentStatus.IN_REVIEW:
      case CommentStatus.APPROVED:
      case CommentStatus.DELETED:
        return false;
      default:
        return true;
    }
  }, [comment.originalState, comment.status]);

  const handleStatusChange = useCallback(
    (value: string) => {
      dispatch(
        updateCommentStatus({
          id: comment.id,
          status: value as CommentStatus,
        }),
      );
    },
    [dispatch, comment.id],
  );

  return (
    <SegmentedControl
      disabled={isDisabled}
      color={color}
      value={comment.status}
      onChange={handleStatusChange}
      data={statuses}
    />
  );
};
