import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { CommentStatus } from "@/models/enums/comment-enums";
import { Depth, ExperienceType, Sentiment } from "@/models/enums/review-enums";
import { ProductCategory } from "@/models/product-category";
import {
  CommentSearchParams,
  CommentSearchResult,
} from "@/models/dtos/comment-search-models";
import { postCommentSearch } from "@/api-actions/user-comment/comment-search";

const DEFAULT_PAGE_SIZE = 500;

interface ThreadCommentSearchState {
  threadId: string | null;
  statusesFilter: CommentStatus[];
  categoriesFilter: string[];
  sentimentsFilter: Sentiment[];
  experiencesFilter: ExperienceType[];
  depthsFilter: Depth[];
  searchTerm: string;
  externalId: string;
  authorId: string;
  parentExternalId: string;
  reviewedBy: string[];
  reviewer: string;
  dateRange: [string | null, string | null];
  sortBy: CommentSearchParams["sort"];
  order: CommentSearchParams["order"];
  pageSize: number;
  totalItems: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  categories: ProductCategory[];
  categoriesLoading: boolean;
}

const buildDefaultFilters = (): Omit<
  ThreadCommentSearchState,
  | "threadId"
  | "totalItems"
  | "totalPages"
  | "loading"
  | "error"
  | "categories"
  | "categoriesLoading"
  | "pageSize"
> => ({
  statusesFilter: [],
  categoriesFilter: [],
  sentimentsFilter: [],
  experiencesFilter: [],
  depthsFilter: [],
  searchTerm: "",
  externalId: "",
  authorId: "",
  parentExternalId: "",
  reviewedBy: [],
  reviewer: "all",
  dateRange: [null, null],
  sortBy: "createdAt",
  order: "ASC",
});

const initialState: ThreadCommentSearchState = {
  threadId: null,
  ...buildDefaultFilters(),
  pageSize: DEFAULT_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  loading: false,
  error: null,
  categories: [],
  categoriesLoading: true,
};

export const fetchThreadComments = createAsyncThunk<
  CommentSearchResult,
  void,
  { state: RootState; rejectValue: string }
>("threadCommentSearch/fetchThreadComments", async (_, thunkApi) => {
  const state = thunkApi.getState().threadCommentSearch;

  if (!state.threadId) {
    return thunkApi.rejectWithValue("threadId not set");
  }

  const params: CommentSearchParams = {
    page: 1,
    pageSize: state.pageSize,
    threadId: state.threadId,
    statuses: state.statusesFilter.length ? state.statusesFilter : undefined,
    categoryIds: state.categoriesFilter.length
      ? state.categoriesFilter
      : undefined,
    sentiments: state.sentimentsFilter.length
      ? state.sentimentsFilter
      : undefined,
    experiences: state.experiencesFilter.length
      ? state.experiencesFilter
      : undefined,
    depths: state.depthsFilter.length ? state.depthsFilter : undefined,
    searchTerm: state.searchTerm || undefined,
    externalId: state.externalId || undefined,
    authorId: state.authorId || undefined,
    parentExternalId: state.parentExternalId || undefined,
    reviewedBy: state.reviewedBy.length ? state.reviewedBy : undefined,
    reviewer: state.reviewer !== "all" ? state.reviewer : undefined,
    dateRange: state.dateRange,
    sort: state.sortBy,
    order: state.order,
  };

  try {
    return await postCommentSearch(params);
  } catch (err: any) {
    return thunkApi.rejectWithValue(
      err?.message || "Failed to fetch thread comments",
    );
  }
});

export const threadCommentSearchSlice = createSlice({
  name: "threadCommentSearch",
  initialState,
  reducers: {
    initForThread: (state, action: PayloadAction<string>) => {
      state.threadId = action.payload;
      Object.assign(state, buildDefaultFilters());
      state.totalItems = 0;
      state.totalPages = 1;
      state.loading = false;
      state.error = null;
    },
    clearThreadSearchState: () => initialState,
    clearFilters: (state) => {
      Object.assign(state, buildDefaultFilters());
    },
    setStatusesFilter: (state, action: PayloadAction<CommentStatus[]>) => {
      state.statusesFilter = action.payload;
    },
    setCategoriesFilter: (state, action: PayloadAction<string[]>) => {
      state.categoriesFilter = action.payload;
    },
    setSentimentsFilter: (state, action: PayloadAction<Sentiment[]>) => {
      state.sentimentsFilter = action.payload;
    },
    setExperiencesFilter: (state, action: PayloadAction<ExperienceType[]>) => {
      state.experiencesFilter = action.payload;
    },
    setDepthsFilter: (state, action: PayloadAction<Depth[]>) => {
      state.depthsFilter = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setExternalId: (state, action: PayloadAction<string>) => {
      state.externalId = action.payload;
    },
    setAuthorId: (state, action: PayloadAction<string>) => {
      state.authorId = action.payload;
    },
    setParentExternalId: (state, action: PayloadAction<string>) => {
      state.parentExternalId = action.payload;
    },
    setReviewedBy: (state, action: PayloadAction<string[]>) => {
      state.reviewedBy = action.payload;
    },
    setReviewer: (state, action: PayloadAction<string>) => {
      state.reviewer = action.payload;
    },
    setDateRange: (
      state,
      action: PayloadAction<[string | null, string | null]>,
    ) => {
      state.dateRange = action.payload;
    },
    setSortBy: (state, action: PayloadAction<CommentSearchParams["sort"]>) => {
      state.sortBy = action.payload;
    },
    setOrder: (state, action: PayloadAction<CommentSearchParams["order"]>) => {
      state.order = action.payload;
    },
    setCategories: (state, action: PayloadAction<ProductCategory[]>) => {
      state.categories = action.payload;
    },
    setCategoriesLoading: (state, action: PayloadAction<boolean>) => {
      state.categoriesLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThreadComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreadComments.fulfilled, (state, action) => {
        state.loading = false;
        state.totalItems = action.payload.totalItems || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.error = null;
      })
      .addCase(fetchThreadComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      });
  },
});

export const {
  initForThread,
  clearThreadSearchState,
  clearFilters,
  setStatusesFilter,
  setCategoriesFilter,
  setSentimentsFilter,
  setExperiencesFilter,
  setDepthsFilter,
  setSearchTerm,
  setExternalId,
  setAuthorId,
  setParentExternalId,
  setReviewedBy,
  setReviewer,
  setDateRange,
  setSortBy,
  setOrder,
  setCategories,
  setCategoriesLoading,
} = threadCommentSearchSlice.actions;

export const selectThreadSearchThreadId = (state: RootState) =>
  state.threadCommentSearch.threadId;
export const selectThreadSearchStatusesFilter = (state: RootState) =>
  state.threadCommentSearch.statusesFilter;
export const selectThreadSearchCategoriesFilter = (state: RootState) =>
  state.threadCommentSearch.categoriesFilter;
export const selectThreadSearchSentimentsFilter = (state: RootState) =>
  state.threadCommentSearch.sentimentsFilter;
export const selectThreadSearchExperiencesFilter = (state: RootState) =>
  state.threadCommentSearch.experiencesFilter;
export const selectThreadSearchDepthsFilter = (state: RootState) =>
  state.threadCommentSearch.depthsFilter;
export const selectThreadSearchSearchTerm = (state: RootState) =>
  state.threadCommentSearch.searchTerm;
export const selectThreadSearchExternalId = (state: RootState) =>
  state.threadCommentSearch.externalId;
export const selectThreadSearchAuthorId = (state: RootState) =>
  state.threadCommentSearch.authorId;
export const selectThreadSearchParentExternalId = (state: RootState) =>
  state.threadCommentSearch.parentExternalId;
export const selectThreadSearchReviewedBy = (state: RootState) =>
  state.threadCommentSearch.reviewedBy;
export const selectThreadSearchReviewer = (state: RootState) =>
  state.threadCommentSearch.reviewer;
export const selectThreadSearchDateRange = (state: RootState) =>
  state.threadCommentSearch.dateRange;
export const selectThreadSearchSortBy = (state: RootState) =>
  state.threadCommentSearch.sortBy;
export const selectThreadSearchOrder = (state: RootState) =>
  state.threadCommentSearch.order;
export const selectThreadSearchTotalItems = (state: RootState) =>
  state.threadCommentSearch.totalItems;
export const selectThreadSearchLoading = (state: RootState) =>
  state.threadCommentSearch.loading;
export const selectThreadSearchError = (state: RootState) =>
  state.threadCommentSearch.error;
export const selectThreadSearchCategories = (state: RootState) =>
  state.threadCommentSearch.categories;
export const selectThreadSearchCategoriesLoading = (state: RootState) =>
  state.threadCommentSearch.categoriesLoading;

export default threadCommentSearchSlice.reducer;
