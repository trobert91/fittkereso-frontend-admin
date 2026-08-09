"use client";
"use no memo";

import {
  Loader,
  Center,
  Pagination,
  Select,
  SimpleGrid,
  Text,
  Group,
} from "@mantine/core";
import { isEmpty } from "lodash";
import { CommentTableFilter } from "./comment-table-filter";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  selectComments,
  selectPage,
  selectPageSize,
  selectTotalPages,
  selectCommentLoading,
  setPage,
  setPageSize,
  selectTotalItems,
  selectCategoriesLoading,
} from "@/store/slices/comment-slice";
import { CommentTableItem } from "./comment-table-item";

// (no relevance badge needed for comment cards)

// (helpers moved into CommentTableItem)

export function CommentTable() {
  const dispatch = useAppDispatch();
  const comments = useAppSelector(selectComments) || [];
  const page = useAppSelector(selectPage);
  const pageSize = useAppSelector(selectPageSize);
  const totalPages = useAppSelector(selectTotalPages);
  const totalItems = useAppSelector(selectTotalItems);
  const loading = useAppSelector(selectCommentLoading);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);

  return (
    <>
      <CommentTableFilter />

      {loading || categoriesLoading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : (
        <>
          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">{totalItems} total items</Text>
            <Group gap="sm">
              <Select
                size="sm"
                label="Per page"
                data={["20", "50", "100"]}
                value={String(pageSize)}
                onChange={(val) => val && dispatch(setPageSize(Number(val)))}
                w={80}
              />
              <Pagination
                total={totalPages}
                value={page}
                onChange={(p) => dispatch(setPage(p))}
                size="sm"
                mt="auto"
              />
            </Group>
          </Group>

          {isEmpty(comments) ? (
            <Center>No comments found</Center>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 1, md: 1 }} spacing="md">
              {comments.map((comment) => (
                <CommentTableItem key={comment.id} comment={comment} />
              ))}
            </SimpleGrid>
          )}

          <Center mt="lg">
            <Pagination
              total={totalPages}
              value={page}
              onChange={(p) => dispatch(setPage(p))}
              size="md"
            />
          </Center>
        </>
      )}
    </>
  );
}
