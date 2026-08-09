"use client";

import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import {
  ActionIcon,
  Card,
  Group,
  Stack,
  MultiSelect,
  TextInput,
  Select,
  CloseButton,
} from "@mantine/core";
import { IoMdRefresh } from "react-icons/io";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { CommentStatus } from "@/models/enums/comment-enums";
import { CommentSearchParams } from "@/models/dtos/comment-search-models";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  fetchComments,
  setPage,
  setPageSize as setPageSizeAction,
  setStatusesFilter as setStatusesFilterAction,
  setCategoriesFilter as setCategoriesFilterAction,
  setSearchTerm as setSearchTermAction,
  setExternalId as setExternalIdAction,
  setThreadId as setThreadIdAction,
  setAuthorId as setAuthorIdAction,
  setParentExternalId as setParentExternalIdAction,
  setReviewedBy as setReviewedByAction,
  setReviewer as setReviewerAction,
  setDateRange as setDateRangeAction,
  setSortBy as setSortByAction,
  setOrder as setOrderAction,
  setCategories as setCategoriesAction,
  setCategoriesLoading as setCategoriesLoadingAction,
  selectStatusesFilter,
  selectCategoriesFilter,
  selectSearchTerm,
  selectExternalId,
  selectThreadId,
  selectAuthorId,
  selectParentExternalId,
  selectReviewedBy,
  selectReviewer,
  selectDateRange,
  selectSortBy,
  selectOrder,
  selectPage,
  selectPageSize,
  selectCategories,
  selectCategoriesLoading,
} from "@/store/slices/comment-slice";
import { CommentDateRangePicker } from "./comment-date-picker";

export const CommentTableFilter = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const page = useAppSelector(selectPage);
  const pageSize = useAppSelector(selectPageSize);
  const statusesFilter = useAppSelector(selectStatusesFilter);
  const categoriesFilter = useAppSelector(selectCategoriesFilter);
  const searchTerm = useAppSelector(selectSearchTerm);
  const externalId = useAppSelector(selectExternalId);
  const threadId = useAppSelector(selectThreadId);
  const authorId = useAppSelector(selectAuthorId);
  const parentExternalId = useAppSelector(selectParentExternalId);
  const reviewedBy = useAppSelector(selectReviewedBy);
  const reviewer = useAppSelector(selectReviewer);
  const dateRange = useAppSelector(selectDateRange);
  const sortBy = useAppSelector(selectSortBy);
  const order = useAppSelector(selectOrder);

  // Local input state so fields stay responsive while debounced updates propagate
  const [searchTermInput, setSearchTermInput] = useState(searchTerm);
  const [externalIdInput, setExternalIdInput] = useState(externalId);
  const [threadIdInput, setThreadIdInput] = useState(threadId);
  const [authorIdInput, setAuthorIdInput] = useState(authorId);
  const [parentExternalIdInput, setParentExternalIdInput] =
    useState(parentExternalId);

  // Categories from Redux
  const categories = useAppSelector(selectCategories);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);

  // Debounced setters that updates the value sent to backend
  const setSearchTermDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setPage(1));
        dispatch(setSearchTermAction(val));
      }, 1000),
    [dispatch],
  );

  const setExternalIdDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setPage(1));
        dispatch(setExternalIdAction(val));
      }, 1000),
    [dispatch],
  );

  const setThreadIdDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setPage(1));
        dispatch(setThreadIdAction(val));
      }, 1000),
    [dispatch],
  );

  const setAuthorIdDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setPage(1));
        dispatch(setAuthorIdAction(val));
      }, 1000),
    [dispatch],
  );

  const setParentExternalIdDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setPage(1));
        dispatch(setParentExternalIdAction(val));
      }, 1000),
    [dispatch],
  );

  useEffect(() => {
    return () => {
      setSearchTermDebounced.cancel();
      setExternalIdDebounced.cancel();
      setThreadIdDebounced.cancel();
      setAuthorIdDebounced.cancel();
      setParentExternalIdDebounced.cancel();
    };
  }, [
    setSearchTermDebounced,
    setExternalIdDebounced,
    setThreadIdDebounced,
    setAuthorIdDebounced,
    setParentExternalIdDebounced,
  ]);

  // Keep local inputs in sync if Redux state changes elsewhere
  useEffect(() => setSearchTermInput(searchTerm), [searchTerm]);
  useEffect(() => setExternalIdInput(externalId), [externalId]);
  useEffect(() => setThreadIdInput(threadId), [threadId]);
  useEffect(() => setAuthorIdInput(authorId), [authorId]);
  useEffect(
    () => setParentExternalIdInput(parentExternalId),
    [parentExternalId],
  );

  // Fetch top 50 categories on mount (with config for use case prefill)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await postCategorySearch({
          page: 1,
          pageSize: 50,
          includeConfig: true,
        });
        dispatch(setCategoriesAction(result.items || []));
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        dispatch(setCategoriesLoadingAction(false));
      }
    };

    fetchCategories();
  }, [dispatch]);

  const buildSearchParams = (): CommentSearchParams => ({
    page,
    pageSize,
    statuses: statusesFilter.length ? statusesFilter : undefined,
    categoryIds: categoriesFilter.length ? categoriesFilter : undefined,
    searchTerm: searchTerm || undefined,
    externalId: externalId || undefined,
    threadId: threadId || undefined,
    authorId: authorId || undefined,
    parentExternalId: parentExternalId || undefined,
    reviewedBy: reviewedBy.length ? reviewedBy : undefined,
    reviewer: reviewer !== "all" ? reviewer : undefined,
    dateRange,
    sort: sortBy,
    order: order,
  });

  const onRefresh = () => {
    dispatch(fetchComments(buildSearchParams()));
  };

  // Trigger search when filters change
  useEffect(() => {
    dispatch(fetchComments(buildSearchParams()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    statusesFilter,
    categoriesFilter,
    searchTerm,
    externalId,
    threadId,
    authorId,
    parentExternalId,
    reviewedBy,
    reviewer,
    dateRange,
    sortBy,
    order,
  ]);

  return (
    <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
      <Stack gap="md">
        <Group gap="md" wrap="wrap">
          <MultiSelect
            label="Filter by status"
            placeholder="Select statuses"
            data={Object.values(CommentStatus).map((s) => ({
              value: s,
              label: s.split("_").join(" "),
            }))}
            value={statusesFilter as unknown as string[]}
            onChange={(vals) => {
              dispatch(setPage(1));
              dispatch(
                setStatusesFilterAction(vals as unknown as CommentStatus[]),
              );
            }}
            clearable
            searchable
            maw={300}
          />
          <MultiSelect
            label="Filter by category"
            placeholder="Select categories"
            data={categories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            value={categoriesFilter}
            onChange={(vals) => {
              dispatch(setPage(1));
              dispatch(setCategoriesFilterAction(vals));
            }}
            clearable
            searchable
            disabled={categoriesLoading}
            maw={300}
          />
          <TextInput
            label="Search"
            placeholder="Search in comments"
            onChange={(e) => {
              const val = e.currentTarget.value;
              setSearchTermInput(val);
              setSearchTermDebounced(val);
            }}
            value={searchTermInput}
            maw={300}
            rightSection={
              searchTermInput ? (
                <CloseButton
                  size="sm"
                  onClick={() => {
                    setSearchTermInput("");
                    setSearchTermDebounced("");
                  }}
                />
              ) : null
            }
          />
          <TextInput
            label="External ID"
            placeholder="Filter by external ID"
            onChange={(e) => {
              const val = e.currentTarget.value;
              setExternalIdInput(val);
              setExternalIdDebounced(val);
            }}
            value={externalIdInput}
            maw={300}
            rightSection={
              externalIdInput ? (
                <CloseButton
                  size="sm"
                  onClick={() => {
                    setExternalIdInput("");
                    setExternalIdDebounced("");
                  }}
                />
              ) : null
            }
          />
          <TextInput
            label="Thread ID"
            placeholder="Filter by thread ID"
            onChange={(e) => {
              const val = e.currentTarget.value;
              setThreadIdInput(val);
              setThreadIdDebounced(val);
            }}
            value={threadIdInput}
            maw={300}
            rightSection={
              threadIdInput ? (
                <CloseButton
                  size="sm"
                  onClick={() => {
                    setThreadIdInput("");
                    setThreadIdDebounced("");
                  }}
                />
              ) : null
            }
          />
          <TextInput
            label="Author ID"
            placeholder="Filter by author ID"
            onChange={(e) => {
              const val = e.currentTarget.value;
              setAuthorIdInput(val);
              setAuthorIdDebounced(val);
            }}
            value={authorIdInput}
            maw={300}
            rightSection={
              authorIdInput ? (
                <CloseButton
                  size="sm"
                  onClick={() => {
                    setAuthorIdInput("");
                    setAuthorIdDebounced("");
                  }}
                />
              ) : null
            }
          />
          <TextInput
            label="Parent External ID"
            placeholder="Filter by parent external ID"
            onChange={(e) => {
              const val = e.currentTarget.value;
              setParentExternalIdInput(val);
              setParentExternalIdDebounced(val);
            }}
            value={parentExternalIdInput}
            maw={300}
            rightSection={
              parentExternalIdInput ? (
                <CloseButton
                  size="sm"
                  onClick={() => {
                    setParentExternalIdInput("");
                    setParentExternalIdDebounced("");
                  }}
                />
              ) : null
            }
          />
          <MultiSelect
            label="Filter by reviewed by"
            placeholder="Select reviewers"
            data={[
              { value: "torzsok.robert1@gmail.com", label: "Robert" },
              { value: "system", label: "System" },
            ]}
            value={reviewedBy}
            onChange={(vals) => {
              dispatch(setPage(1));
              dispatch(setReviewedByAction(vals));
            }}
            clearable
            searchable
            maw={300}
          />
          <Select
            label="Reviewer"
            placeholder="Select reviewer"
            data={[
              { value: "all", label: "All" },
              { value: "Robi", label: "Robi" },
              { value: "Ancsi", label: "Ancsi" },
            ]}
            value={reviewer}
            onChange={(val) => {
              dispatch(setPage(1));
              dispatch(setReviewerAction(val || "all"));
            }}
            maw={200}
          />

          <CommentDateRangePicker
            value={dateRange}
            onSelected={(range) => {
              dispatch(setPage(1));
              dispatch(setDateRangeAction(range));
            }}
          />

          <Select
            label="Sort by"
            placeholder="Select sort field"
            data={[
              { value: "moderationPriority", label: "Moderation Priority" },
              { value: "relevance", label: "Relevance" },
              { value: "reviewScore", label: "Review Score" },
              { value: "status", label: "Status" },
              { value: "lastSynced", label: "Last Synced" },
              { value: "createdAt", label: "Created At" },
              { value: "updatedAt", label: "Updated At" },
            ]}
            value={sortBy}
            onChange={(val) => {
              dispatch(setPage(1));
              dispatch(setSortByAction(val as CommentSearchParams["sort"]));
            }}
            maw={200}
          />
          <Select
            label="Order"
            placeholder="Select order"
            data={[
              { value: "ASC", label: "Ascending" },
              { value: "DESC", label: "Descending" },
            ]}
            value={order}
            onChange={(val) => {
              dispatch(setOrderAction(val as CommentSearchParams["order"]));
              dispatch(setPage(1));
            }}
            maw={150}
          />
          <ActionIcon
            variant="light"
            size="lg"
            onClick={onRefresh}
            mt="auto"
          >
            <IoMdRefresh size={20} />
          </ActionIcon>
        </Group>
      </Stack>
    </Card>
  );
};
