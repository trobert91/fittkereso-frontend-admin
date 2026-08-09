import { keyBy } from "lodash";
import { UserComment } from "@/models/user-comment";

export function buildCommentTree(comments: UserComment[]): UserComment[] {
  const map = keyBy(comments, "id");
  const roots: UserComment[] = [];

  for (const comment of comments) {
    comment.children = [];
  }

  for (const comment of comments) {
    const parentId = comment.parent?.id;
    if (parentId && map[parentId]) {
      map[parentId].children!.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}
