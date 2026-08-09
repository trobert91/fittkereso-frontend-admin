"use client";

import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import {
  ActionIcon,
  Button,
  Card,
  CloseButton,
  Group,
  Loader,
  MultiSelect,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IoMdRefresh } from "react-icons/io";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { CommentStatus } from "@/models/enums/comment-enums";
import { Depth, ExperienceType, Sentiment } from "@/models/enums/review-enums";
import { CommentSearchParams } from "@/models/dtos/comment-search-models";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  clearFilters,
  clearThreadSearchState,
  fetchThreadComments,
  initForThread,
  selectThreadSearchAuthorId,
  selectThreadSearchCategories,
  selectThreadSearchCategoriesFilter,
  selectThreadSearchCategoriesLoading,
  selectThreadSearchDateRange,
  selectThreadSearchDepthsFilter,
  selectThreadSearchExperiencesFilter,
  selectThreadSearchExternalId,
  selectThreadSearchLoading,
  selectThreadSearchOrder,
  selectThreadSearchParentExternalId,
  selectThreadSearchReviewedBy,
  selectThreadSearchReviewer,
  selectThreadSearchSearchTerm,
  selectThreadSearchSentimentsFilter,
  selectThreadSearchSortBy,
  selectThreadSearchStatusesFilter,
  selectThreadSearchThreadId,
  selectThreadSearchTotalItems,
  setAuthorId,
  setCategories,
  setCategoriesFilter,
  setCategoriesLoading,
  setDateRange,
  setDepthsFilter,
  setExperiencesFilter,
  setExternalId,
  setOrder,
  setParentExternalId,
  setReviewedBy,
  setReviewer,
  setSearchTerm,
  setSentimentsFilter,
  setSortBy,
  setStatusesFilter,
} from "@/store/slices/thread-comment-search-slice";
import { setThreadComments } from "@/store/slices/thread-comment-slice";
import { CommentDateRangePicker } from "../comment/comment-date-picker";

const humanize = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

interface ThreadCommentFilterProps {
  threadId: string;
}

export const ThreadCommentFilter = ({ threadId }: ThreadCommentFilterProps) => {
  const dispatch = useAppDispatch();

  const activeThreadId = useAppSelector(selectThreadSearchThreadId);
  const statusesFilter = useAppSelector(selectThreadSearchStatusesFilter);
  const categoriesFilter = useAppSelector(selectThreadSearchCategoriesFilter);
  const sentimentsFilter = useAppSelector(selectThreadSearchSentimentsFilter);
  const experiencesFilter = useAppSelector(selectThreadSearchExperiencesFilter);
  const depthsFilter = useAppSelector(selectThreadSearchDepthsFilter);
  const searchTerm = useAppSelector(selectThreadSearchSearchTerm);
  const externalId = useAppSelector(selectThreadSearchExternalId);
  const authorId = useAppSelector(selectThreadSearchAuthorId);
  const parentExternalId = useAppSelector(selectThreadSearchParentExternalId);
  const reviewedBy = useAppSelector(selectThreadSearchReviewedBy);
  const reviewer = useAppSelector(selectThreadSearchReviewer);
  const dateRange = useAppSelector(selectThreadSearchDateRange);
  const sortBy = useAppSelector(selectThreadSearchSortBy);
  const order = useAppSelector(selectThreadSearchOrder);
  const totalItems = useAppSelector(selectThreadSearchTotalItems);
  const loading = useAppSelector(selectThreadSearchLoading);
  const categories = useAppSelector(selectThreadSearchCategories);
  const categoriesLoading = useAppSelector(
    selectThreadSearchCategoriesLoading,
  );

  const [searchTermInput, setSearchTermInput] = useState(searchTerm);
  const [externalIdInput, setExternalIdInput] = useState(externalId);
  const [authorIdInput, setAuthorIdInput] = useState(authorId);
  const [parentExternalIdInput, setParentExternalIdInput] =
    useState(parentExternalId);

  useEffect(() => {
    dispatch(initForThread(threadId));
    return () => {
      dispatch(clearThreadSearchState());
    };
  }, [threadId, dispatch]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await postCategorySearch({
          page: 1,
          pageSize: 50,
          includeConfig: true,
        });
        dispatch(setCategories(result.items || []));
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        dispatch(setCategoriesLoading(false));
      }
    };

    fetchCategories();
  }, [dispatch]);

  const runFetch = useMemo(
    () => () => {
      dispatch(fetchThreadComments())
        .unwrap()
        .then((result) => {
          dispatch(setThreadComments(result.items || []));
        })
        .catch(() => {
          // slice captures the error
        });
    },
    [dispatch],
  );

  const setSearchTermDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setSearchTerm(val));
      }, 1000),
    [dispatch],
  );
  const setExternalIdDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setExternalId(val));
      }, 1000),
    [dispatch],
  );
  const setAuthorIdDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setAuthorId(val));
      }, 1000),
    [dispatch],
  );
  const setParentExternalIdDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setParentExternalId(val));
      }, 1000),
    [dispatch],
  );

  useEffect(() => {
    return () => {
      setSearchTermDebounced.cancel();
      setExternalIdDebounced.cancel();
      setAuthorIdDebounced.cancel();
      setParentExternalIdDebounced.cancel();
    };
  }, [
    setSearchTermDebounced,
    setExternalIdDebounced,
    setAuthorIdDebounced,
    setParentExternalIdDebounced,
  ]);

  useEffect(() => setSearchTermInput(searchTerm), [searchTerm]);
  useEffect(() => setExternalIdInput(externalId), [externalId]);
  useEffect(() => setAuthorIdInput(authorId), [authorId]);
  useEffect(
    () => setParentExternalIdInput(parentExternalId),
    [parentExternalId],
  );

  useEffect(() => {
    if (activeThreadId !== threadId) {
      return;
    }
    runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeThreadId,
    threadId,
    statusesFilter,
    categoriesFilter,
    sentimentsFilter,
    experiencesFilter,
    depthsFilter,
    searchTerm,
    externalId,
    authorId,
    parentExternalId,
    reviewedBy,
    reviewer,
    dateRange,
    sortBy,
    order,
  ]);

  return (
    <Card shadow="sm" padding="sm" radius="sm" mb="md" withBorder>
      <Stack gap="md">
        <Group gap="md" wrap="wrap" align="flex-end">
          <MultiSelect
            label="Status"
            placeholder="Select statuses"
            data={Object.values(CommentStatus).map((s) => ({
              value: s,
              label: humanize(s),
            }))}
            value={statusesFilter as unknown as string[]}
            onChange={(vals) =>
              dispatch(
                setStatusesFilter(vals as unknown as CommentStatus[]),
              )
            }
            clearable
            searchable
            maw={260}
          />
          <MultiSelect
            label="Category"
            placeholder="Select categories"
            data={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={categoriesFilter}
            onChange={(vals) => dispatch(setCategoriesFilter(vals))}
            clearable
            searchable
            disabled={categoriesLoading}
            maw={260}
          />
          <MultiSelect
            label="Sentiment"
            placeholder="Select sentiments"
            data={Object.values(Sentiment).map((s) => ({
              value: s,
              label: humanize(s),
            }))}
            value={sentimentsFilter as unknown as string[]}
            onChange={(vals) =>
              dispatch(setSentimentsFilter(vals as unknown as Sentiment[]))
            }
            clearable
            searchable
            maw={260}
          />
          <MultiSelect
            label="Experience"
            placeholder="Select experiences"
            data={Object.values(ExperienceType).map((s) => ({
              value: s,
              label: humanize(s),
            }))}
            value={experiencesFilter as unknown as string[]}
            onChange={(vals) =>
              dispatch(
                setExperiencesFilter(vals as unknown as ExperienceType[]),
              )
            }
            clearable
            searchable
            maw={260}
          />
          <MultiSelect
            label="Depth"
            placeholder="Select depths"
            data={Object.values(Depth).map((s) => ({
              value: s,
              label: humanize(s),
            }))}
            value={depthsFilter as unknown as string[]}
            onChange={(vals) =>
              dispatch(setDepthsFilter(vals as unknown as Depth[]))
            }
            clearable
            searchable
            maw={260}
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
            maw={260}
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
            maw={260}
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
            label="Author ID"
            placeholder="Filter by author ID"
            onChange={(e) => {
              const val = e.currentTarget.value;
              setAuthorIdInput(val);
              setAuthorIdDebounced(val);
            }}
            value={authorIdInput}
            maw={260}
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
            maw={260}
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
            label="Reviewed by"
            placeholder="Select reviewers"
            data={[
              { value: "torzsok.robert1@gmail.com", label: "Robert" },
              { value: "system", label: "System" },
            ]}
            value={reviewedBy}
            onChange={(vals) => dispatch(setReviewedBy(vals))}
            clearable
            searchable
            maw={240}
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
            onChange={(val) => dispatch(setReviewer(val || "all"))}
            maw={180}
          />
          <CommentDateRangePicker
            value={dateRange}
            onSelected={(range) => dispatch(setDateRange(range))}
          />
          <Select
            label="Sort by"
            placeholder="Select sort field"
            data={[
              { value: "relevance", label: "Relevance" },
              { value: "status", label: "Status" },
              { value: "lastSynced", label: "Last Synced" },
              { value: "createdAt", label: "Created At" },
              { value: "updatedAt", label: "Updated At" },
            ]}
            value={sortBy}
            onChange={(val) =>
              dispatch(setSortBy(val as CommentSearchParams["sort"]))
            }
            maw={180}
          />
          <Select
            label="Order"
            placeholder="Select order"
            data={[
              { value: "ASC", label: "Ascending" },
              { value: "DESC", label: "Descending" },
            ]}
            value={order}
            onChange={(val) =>
              dispatch(setOrder(val as CommentSearchParams["order"]))
            }
            maw={140}
          />
        </Group>
        <Group justify="space-between" gap="md" wrap="wrap">
          <Group gap="xs">
            {loading ? (
              <Loader size="xs" />
            ) : (
              <Text size="sm" c="dimmed">
                {totalItems} comment{totalItems === 1 ? "" : "s"}
              </Text>
            )}
          </Group>
          <Group gap="xs">
            <Button
              variant="light"
              onClick={() => dispatch(clearFilters())}
              disabled={loading}
            >
              Reset
            </Button>
            <ActionIcon
              variant="light"
              size="lg"
              onClick={runFetch}
              disabled={loading}
              aria-label="Refresh"
            >
              <IoMdRefresh size={20} />
            </ActionIcon>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
};
