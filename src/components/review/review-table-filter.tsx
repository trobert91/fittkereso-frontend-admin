"use client";

import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import {
  Card,
  Checkbox,
  Group,
  Stack,
  MultiSelect,
  TextInput,
  Select,
  CloseButton,
} from "@mantine/core";
import { postCategorySearch } from "@/api-actions/category/category-search";
import {
  Depth,
  ExperienceType,
  Intent,
  Sentiment,
} from "@/models/enums/review-enums";
import { ReviewSearchParams } from "@/models/dtos/review-search-models";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  fetchReviews,
  setReviewPage,
  setReviewPageSize,
  setReviewSearchTerm,
  setReviewSentimentsFilter,
  setReviewExperiencesFilter,
  setReviewIntentsFilter,
  setReviewDepthsFilter,
  setReviewPlatformsFilter,
  setReviewCategoriesFilter,
  setReviewEnabledFilter,
  setReviewIncludeDeleted,
  setReviewProductIdFilter,
  setReviewProductSlugFilter,
  setReviewUserIdFilter,
  setReviewDateRange,
  setReviewMinScore,
  setReviewSortBy,
  setReviewOrder,
  setReviewCategories,
  setReviewCategoriesLoading,
  selectReviewSearchTerm,
  selectReviewSentimentsFilter,
  selectReviewExperiencesFilter,
  selectReviewIntentsFilter,
  selectReviewDepthsFilter,
  selectReviewPlatformsFilter,
  selectReviewCategoriesFilter,
  selectReviewEnabledFilter,
  selectReviewIncludeDeleted,
  selectReviewProductIdFilter,
  selectReviewProductSlugFilter,
  selectReviewUserIdFilter,
  selectReviewDateRange,
  selectReviewMinScore,
  selectReviewSortBy,
  selectReviewOrder,
  selectReviewPage,
  selectReviewPageSize,
  selectReviewCategories,
  selectReviewCategoriesLoading,
} from "@/store/slices/review-slice";
import { CommentDateRangePicker } from "../comment/comment-date-picker";

export const ReviewTableFilter = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const page = useAppSelector(selectReviewPage);
  const pageSize = useAppSelector(selectReviewPageSize);
  const searchTerm = useAppSelector(selectReviewSearchTerm);
  const sentimentsFilter = useAppSelector(selectReviewSentimentsFilter);
  const experiencesFilter = useAppSelector(selectReviewExperiencesFilter);
  const intentsFilter = useAppSelector(selectReviewIntentsFilter);
  const depthsFilter = useAppSelector(selectReviewDepthsFilter);
  const platformsFilter = useAppSelector(selectReviewPlatformsFilter);
  const categoriesFilter = useAppSelector(selectReviewCategoriesFilter);
  const enabledFilter = useAppSelector(selectReviewEnabledFilter);
  const includeDeleted = useAppSelector(selectReviewIncludeDeleted);
  const productIdFilter = useAppSelector(selectReviewProductIdFilter);
  const productSlugFilter = useAppSelector(selectReviewProductSlugFilter);
  const userIdFilter = useAppSelector(selectReviewUserIdFilter);
  const dateRange = useAppSelector(selectReviewDateRange);
  const minReviewScore = useAppSelector(selectReviewMinScore);
  const sortBy = useAppSelector(selectReviewSortBy);
  const order = useAppSelector(selectReviewOrder);

  // Local input state for debounced fields
  const [searchTermInput, setSearchTermInput] = useState(searchTerm);
  const [productIdInput, setProductIdInput] = useState(productIdFilter);
  const [productSlugInput, setProductSlugInput] = useState(productSlugFilter);
  const [userIdInput, setUserIdInput] = useState(userIdFilter);
  const [minScoreInput, setMinScoreInput] = useState(minReviewScore);

  // Categories
  const categories = useAppSelector(selectReviewCategories);
  const categoriesLoading = useAppSelector(selectReviewCategoriesLoading);

  // Debounced setters
  const setSearchTermDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setReviewPage(1));
        dispatch(setReviewSearchTerm(val));
      }, 1000),
    [dispatch]
  );

  const setProductIdDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setReviewPage(1));
        dispatch(setReviewProductIdFilter(val));
      }, 1000),
    [dispatch]
  );

  const setProductSlugDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setReviewPage(1));
        dispatch(setReviewProductSlugFilter(val));
      }, 1000),
    [dispatch]
  );

  const setUserIdDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setReviewPage(1));
        dispatch(setReviewUserIdFilter(val));
      }, 1000),
    [dispatch]
  );

  const setMinScoreDebounced = useMemo(
    () =>
      debounce((val: string) => {
        dispatch(setReviewPage(1));
        dispatch(setReviewMinScore(val));
      }, 1000),
    [dispatch]
  );

  useEffect(() => {
    return () => {
      setSearchTermDebounced.cancel();
      setProductIdDebounced.cancel();
      setProductSlugDebounced.cancel();
      setUserIdDebounced.cancel();
      setMinScoreDebounced.cancel();
    };
  }, [
    setSearchTermDebounced,
    setProductIdDebounced,
    setProductSlugDebounced,
    setUserIdDebounced,
    setMinScoreDebounced,
  ]);

  // Keep local inputs in sync if Redux state changes elsewhere
  useEffect(() => setSearchTermInput(searchTerm), [searchTerm]);
  useEffect(() => setProductIdInput(productIdFilter), [productIdFilter]);
  useEffect(() => setProductSlugInput(productSlugFilter), [productSlugFilter]);
  useEffect(() => setUserIdInput(userIdFilter), [userIdFilter]);
  useEffect(() => setMinScoreInput(minReviewScore), [minReviewScore]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await postCategorySearch({
          page: 1,
          pageSize: 50,
          includeConfig: true,
        });
        dispatch(setReviewCategories(result.items || []));
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        dispatch(setReviewCategoriesLoading(false));
      }
    };

    fetchCategories();
  }, [dispatch]);

  // Trigger search when filters change
  useEffect(() => {
    const searchParams: ReviewSearchParams = {
      page,
      pageSize,
      searchTerm: searchTerm || undefined,
      sentiments: sentimentsFilter.length ? sentimentsFilter : undefined,
      experiences: experiencesFilter.length ? experiencesFilter : undefined,
      intents: intentsFilter.length ? intentsFilter : undefined,
      depths: depthsFilter.length ? depthsFilter : undefined,
      platforms: platformsFilter.length ? platformsFilter : undefined,
      categoryIds: categoriesFilter.length ? categoriesFilter : undefined,
      enabled:
        enabledFilter === "enabled"
          ? true
          : enabledFilter === "disabled"
            ? false
            : undefined,
      includeDeleted: includeDeleted || undefined,
      productId: productIdFilter || undefined,
      productSlug: productSlugFilter || undefined,
      userId: userIdFilter || undefined,
      dateRange,
      minReviewScore: minReviewScore ? Number(minReviewScore) : undefined,
      sort: sortBy,
      order: order,
    };

    dispatch(fetchReviews(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    searchTerm,
    sentimentsFilter,
    experiencesFilter,
    intentsFilter,
    depthsFilter,
    platformsFilter,
    categoriesFilter,
    enabledFilter,
    includeDeleted,
    productIdFilter,
    productSlugFilter,
    userIdFilter,
    dateRange,
    minReviewScore,
    sortBy,
    order,
  ]);

  return (
    <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
      <Stack gap="md">
        <Group gap="md" wrap="wrap">
          <MultiSelect
            label="Sentiment"
            placeholder="Select sentiments"
            data={Object.values(Sentiment).map((s) => ({
              value: s,
              label: s,
            }))}
            value={sentimentsFilter}
            onChange={(vals) => {
              dispatch(setReviewPage(1));
              dispatch(setReviewSentimentsFilter(vals as Sentiment[]));
            }}
            clearable
            searchable
            maw={250}
          />
          <MultiSelect
            label="Experience"
            placeholder="Select experiences"
            data={Object.values(ExperienceType).map((e) => ({
              value: e,
              label: e.split("_").join(" "),
            }))}
            value={experiencesFilter}
            onChange={(vals) => {
              dispatch(setReviewPage(1));
              dispatch(setReviewExperiencesFilter(vals as ExperienceType[]));
            }}
            clearable
            searchable
            maw={250}
          />
          <MultiSelect
            label="Intent"
            placeholder="Select intents"
            data={Object.values(Intent).map((i) => ({
              value: i,
              label: i.split("_").join(" "),
            }))}
            value={intentsFilter}
            onChange={(vals) => {
              dispatch(setReviewPage(1));
              dispatch(setReviewIntentsFilter(vals as Intent[]));
            }}
            clearable
            searchable
            maw={250}
          />
          <MultiSelect
            label="Depth"
            placeholder="Select depths"
            data={Object.values(Depth).map((d) => ({
              value: d,
              label: d,
            }))}
            value={depthsFilter}
            onChange={(vals) => {
              dispatch(setReviewPage(1));
              dispatch(setReviewDepthsFilter(vals as Depth[]));
            }}
            clearable
            searchable
            maw={200}
          />
          <MultiSelect
            label="Platform"
            placeholder="Select platforms"
            data={[
              { value: "reddit", label: "Reddit" },
              { value: "youtube", label: "YouTube" },
            ]}
            value={platformsFilter}
            onChange={(vals) => {
              dispatch(setReviewPage(1));
              dispatch(setReviewPlatformsFilter(vals));
            }}
            clearable
            maw={200}
          />
          <MultiSelect
            label="Category"
            placeholder="Select categories"
            data={categories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            value={categoriesFilter}
            onChange={(vals) => {
              dispatch(setReviewPage(1));
              dispatch(setReviewCategoriesFilter(vals));
            }}
            clearable
            searchable
            disabled={categoriesLoading}
            maw={300}
          />
          <TextInput
            label="Search"
            placeholder="Search in reviews"
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
            label="Product ID"
            placeholder="Filter by product ID"
            onChange={(e) => {
              const val = e.currentTarget.value;
              setProductIdInput(val);
              setProductIdDebounced(val);
            }}
            value={productIdInput}
            maw={300}
            rightSection={
              productIdInput ? (
                <CloseButton
                  size="sm"
                  onClick={() => {
                    setProductIdInput("");
                    setProductIdDebounced("");
                  }}
                />
              ) : null
            }
          />
          <TextInput
            label="Product Slug"
            placeholder="Filter by product slug"
            onChange={(e) => {
              const val = e.currentTarget.value;
              setProductSlugInput(val);
              setProductSlugDebounced(val);
            }}
            value={productSlugInput}
            maw={300}
            rightSection={
              productSlugInput ? (
                <CloseButton
                  size="sm"
                  onClick={() => {
                    setProductSlugInput("");
                    setProductSlugDebounced("");
                  }}
                />
              ) : null
            }
          />
          <TextInput
            label="User ID"
            placeholder="Filter by user ID"
            onChange={(e) => {
              const val = e.currentTarget.value;
              setUserIdInput(val);
              setUserIdDebounced(val);
            }}
            value={userIdInput}
            maw={300}
            rightSection={
              userIdInput ? (
                <CloseButton
                  size="sm"
                  onClick={() => {
                    setUserIdInput("");
                    setUserIdDebounced("");
                  }}
                />
              ) : null
            }
          />
          <TextInput
            label="Min Review Score"
            placeholder="e.g. 50"
            onChange={(e) => {
              const val = e.currentTarget.value;
              setMinScoreInput(val);
              setMinScoreDebounced(val);
            }}
            value={minScoreInput}
            maw={150}
            rightSection={
              minScoreInput ? (
                <CloseButton
                  size="sm"
                  onClick={() => {
                    setMinScoreInput("");
                    setMinScoreDebounced("");
                  }}
                />
              ) : null
            }
          />
          <Select
            label="Enabled"
            data={[
              { value: "all", label: "All" },
              { value: "enabled", label: "Enabled" },
              { value: "disabled", label: "Disabled" },
            ]}
            value={enabledFilter}
            onChange={(val) => {
              dispatch(setReviewPage(1));
              dispatch(
                setReviewEnabledFilter(
                  (val as "all" | "enabled" | "disabled") || "all"
                )
              );
            }}
            maw={150}
          />
          <Checkbox
            label="Include deleted"
            checked={includeDeleted}
            onChange={(e) => {
              dispatch(setReviewPage(1));
              dispatch(setReviewIncludeDeleted(e.currentTarget.checked));
            }}
            mt={28}
          />

          <CommentDateRangePicker
            value={dateRange}
            onSelected={(range) => {
              dispatch(setReviewPage(1));
              dispatch(setReviewDateRange(range));
            }}
          />

          <Select
            label="Sort by"
            placeholder="Select sort field"
            data={[
              { value: "reviewScore", label: "Review Score" },
              { value: "totalUpvotes", label: "Upvotes" },
              { value: "totalDownvotes", label: "Downvotes" },
              { value: "sentiment", label: "Sentiment" },
              { value: "experience", label: "Experience" },
              { value: "depth", label: "Depth" },
              { value: "externalCreationTs", label: "External Created" },
              { value: "createdAt", label: "Created At" },
              { value: "updatedAt", label: "Updated At" },
              { value: "partCount", label: "Part Count" },
            ]}
            value={sortBy}
            onChange={(val) => {
              dispatch(setReviewPage(1));
              dispatch(
                setReviewSortBy(val as ReviewSearchParams["sort"])
              );
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
              dispatch(
                setReviewOrder(val as ReviewSearchParams["order"])
              );
              dispatch(setReviewPage(1));
            }}
            maw={150}
          />
        </Group>
      </Stack>
    </Card>
  );
};
