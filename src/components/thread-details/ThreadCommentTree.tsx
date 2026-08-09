"use client";

import { useEffect, useMemo } from "react";
import { Box, Stack } from "@mantine/core";
import { cloneDeep } from "lodash";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  selectThreadComments,
  clearThreadComments,
  undoThreadCommentChanges,
  changeThreadProductReference,
} from "@/store/slices/thread-comment-slice";
import { UserComment } from "@/models/user-comment";
import { ProductReference } from "@/models/product-reference";
import { CommentTableItem } from "../comment/comment-table-item";
import { buildCommentTree } from "@/utils/comment-tree";

const CommentTreeNode = ({
  comment,
  depth,
}: {
  comment: UserComment;
  depth: number;
}) => {
  const currentComment =
    useAppSelector(
      (state) =>
        selectThreadComments(state)?.find((c) => c.id === comment.id),
    ) ?? comment;
  const dispatch = useAppDispatch();

  const handleUndoChanges = useMemo(
    () => (payload: { id: string }) => {
      dispatch(undoThreadCommentChanges(payload));
    },
    [dispatch],
  );

  const handleChangeProductReference = useMemo(
    () =>
      (payload: {
        commentId: string;
        productReference: Partial<ProductReference> & { id: string };
      }) => {
        dispatch(changeThreadProductReference(payload));
      },
    [dispatch],
  );

  return (
    <Box ml={depth > 0 ? 30 : 0}>
      <CommentTableItem
        comment={currentComment}
        hideParentThread
        onUndoChanges={handleUndoChanges}
        onChangeProductReference={handleChangeProductReference}
      />
      {comment.children?.map((child) => (
        <CommentTreeNode key={child.id} comment={child} depth={depth + 1} />
      ))}
    </Box>
  );
};

export const ThreadCommentTree = () => {
  const comments = useAppSelector(selectThreadComments);
  const dispatch = useAppDispatch();

  useEffect(() => {
    return () => {
      dispatch(clearThreadComments());
    };
  }, [dispatch]);

  const tree = useMemo(
    () => (comments ? buildCommentTree(cloneDeep(comments)) : []),
    [comments],
  );

  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      {tree.map((node) => (
        <CommentTreeNode key={node.id} comment={node} depth={0} />
      ))}
    </Stack>
  );
};
