"use client";
"use no memo";

import {
  Loader,
  Center,
  Pagination,
  Select,
  SimpleGrid,
  Group,
  Text,
} from "@mantine/core";
import { isEmpty } from "lodash";
import { ReviewTableFilter } from "./review-table-filter";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  selectReviews,
  selectReviewPage,
  selectReviewPageSize,
  selectReviewTotalPages,
  selectReviewLoading,
  setReviewPage,
  setReviewPageSize,
  selectReviewTotalItems,
  selectReviewCategoriesLoading,
} from "@/store/slices/review-slice";
import { ReviewTableItem } from "./review-table-item";

export function ReviewTable() {
  const dispatch = useAppDispatch();
  const reviews = useAppSelector(selectReviews) || [];
  const page = useAppSelector(selectReviewPage);
  const pageSize = useAppSelector(selectReviewPageSize);
  const totalPages = useAppSelector(selectReviewTotalPages);
  const totalItems = useAppSelector(selectReviewTotalItems);
  const loading = useAppSelector(selectReviewLoading);
  const categoriesLoading = useAppSelector(selectReviewCategoriesLoading);

  return (
    <>
      <ReviewTableFilter />

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
                size="xs"
                label="Per page"
                data={["20", "50", "100"]}
                value={String(pageSize)}
                onChange={(val) => val && dispatch(setReviewPageSize(Number(val)))}
                w={80}
              />
              <Pagination
                total={totalPages}
                value={page}
                onChange={(p) => dispatch(setReviewPage(p))}
                size="sm"
                mt="auto"
              />
            </Group>
          </Group>

          {isEmpty(reviews) ? (
            <Center>No reviews found</Center>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 1, md: 1 }} spacing="md">
              {reviews.map((review) => (
                <ReviewTableItem key={review.id} review={review} />
              ))}
            </SimpleGrid>
          )}

          <Center mt="lg">
            <Pagination
              total={totalPages}
              value={page}
              onChange={(p) => dispatch(setReviewPage(p))}
              size="md"
            />
          </Center>
        </>
      )}
    </>
  );
}
