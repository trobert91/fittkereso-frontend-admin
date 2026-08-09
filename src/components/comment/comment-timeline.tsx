"use client";

import { UserComment } from "@/models/user-comment";
import { CommentThreadTree } from "./comment-thread-tree";
import { SanitizedHtml } from "../sanitized-html";

type Props = {
  comment: UserComment;
};

export const CommentTimeline = ({ comment }: Props) => {
  return (
    <CommentThreadTree comment={comment}>
      <SanitizedHtml html={comment.body} />
    </CommentThreadTree>
  );
};
