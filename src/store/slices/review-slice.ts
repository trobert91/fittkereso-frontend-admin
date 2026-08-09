import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { Review } from "@/models/review";
import { ProductCategory } from "@/models/product-category";
import {
  Depth,
  ExperienceType,
  Intent,
  Sentiment,
} from "@/models/enums/review-enums";
import {
  ReviewSearchParams,
  ReviewSearchResult,
} from "@/models/dtos/review-search-models";
import { postReviewSearch } from "@/api-actions/review/review-search";
import { putReviewUpdate, UpdateReviewDto } from "@/api-actions/review/review-update";
import dayjs from "dayjs";

// --- State type ---
interface ReviewListState {
  reviews: Review[] | null;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  loading: boolean;
  error: string | null;
  // Filter state
  searchTerm: string;
  sentimentsFilter: Sentiment[];
  experiencesFilter: ExperienceType[];
  intentsFilter: Intent[];
  depthsFilter: Depth[];
  platformsFilter: string[];
  categoriesFilter: string[];
  enabledFilter: "all" | "enabled" | "disabled";
  includeDeleted: boolean;
  productIdFilter: string;
  productSlugFilter: string;
  userIdFilter: string;
  dateRange: [string | null, string | null];
  minReviewScore: string;
  sortBy: ReviewSearchParams["sort"];
  order: ReviewSearchParams["order"];
  // Category data
  categories: ProductCategory[];
  categoriesLoading: boolean;
}

// --- Initial state ---
const initialState: ReviewListState = {
  reviews: null,
  page: 1,
  pageSize: 50,
  totalPages: 1,
  totalItems: 0,
  loading: false,
  error: null,
  // Filter defaults
  searchTerm: "",
  sentimentsFilter: [],
  experiencesFilter: [],
  intentsFilter: [],
  depthsFilter: [],
  platformsFilter: [],
  categoriesFilter: [],
  enabledFilter: "all",
  includeDeleted: false,
  productIdFilter: "",
  productSlugFilter: "",
  userIdFilter: "",
  dateRange: [
    dayjs().subtract(30, "days").toISOString(),
    dayjs().toISOString(),
  ],
  minReviewScore: "",
  sortBy: "reviewScore",
  order: "DESC",
  categories: [],
  categoriesLoading: true,
};

// --- Async thunks ---
export const fetchReviews = createAsyncThunk<
  ReviewSearchResult,
  ReviewSearchParams,
  { rejectValue: string }
>("review/fetchReviews", async (params, thunkApi) => {
  try {
    return await postReviewSearch(params);
  } catch (err: any) {
    return thunkApi.rejectWithValue(err.message || "Failed to fetch reviews");
  }
});

export const updateReview = createAsyncThunk<
  { id: string; dto: UpdateReviewDto },
  { id: string; dto: UpdateReviewDto },
  { state: RootState; rejectValue: string }
>("review/updateReview", async ({ id, dto }, thunkApi) => {
  try {
    await putReviewUpdate(id, dto);
    return { id, dto };
  } catch (err: any) {
    return thunkApi.rejectWithValue(err.message || "Failed to update review");
  }
});

// --- Slice ---
export const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    setReviewPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setReviewPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1;
    },
    setReviewSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setReviewSentimentsFilter: (
      state,
      action: PayloadAction<Sentiment[]>
    ) => {
      state.sentimentsFilter = action.payload;
    },
    setReviewExperiencesFilter: (
      state,
      action: PayloadAction<ExperienceType[]>
    ) => {
      state.experiencesFilter = action.payload;
    },
    setReviewIntentsFilter: (state, action: PayloadAction<Intent[]>) => {
      state.intentsFilter = action.payload;
    },
    setReviewDepthsFilter: (state, action: PayloadAction<Depth[]>) => {
      state.depthsFilter = action.payload;
    },
    setReviewPlatformsFilter: (state, action: PayloadAction<string[]>) => {
      state.platformsFilter = action.payload;
    },
    setReviewCategoriesFilter: (state, action: PayloadAction<string[]>) => {
      state.categoriesFilter = action.payload;
    },
    setReviewEnabledFilter: (
      state,
      action: PayloadAction<"all" | "enabled" | "disabled">
    ) => {
      state.enabledFilter = action.payload;
    },
    setReviewIncludeDeleted: (state, action: PayloadAction<boolean>) => {
      state.includeDeleted = action.payload;
    },
    setReviewProductIdFilter: (state, action: PayloadAction<string>) => {
      state.productIdFilter = action.payload;
    },
    setReviewProductSlugFilter: (state, action: PayloadAction<string>) => {
      state.productSlugFilter = action.payload;
    },
    setReviewUserIdFilter: (state, action: PayloadAction<string>) => {
      state.userIdFilter = action.payload;
    },
    setReviewDateRange: (
      state,
      action: PayloadAction<[string | null, string | null]>
    ) => {
      state.dateRange = action.payload;
    },
    setReviewMinScore: (state, action: PayloadAction<string>) => {
      state.minReviewScore = action.payload;
    },
    setReviewSortBy: (
      state,
      action: PayloadAction<ReviewSearchParams["sort"]>
    ) => {
      state.sortBy = action.payload;
    },
    setReviewOrder: (
      state,
      action: PayloadAction<ReviewSearchParams["order"]>
    ) => {
      state.order = action.payload;
    },
    setReviewCategories: (state, action: PayloadAction<ProductCategory[]>) => {
      state.categories = action.payload;
    },
    setReviewCategoriesLoading: (state, action: PayloadAction<boolean>) => {
      state.categoriesLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.items || [];
        state.totalPages = action.payload.totalPages || 1;
        state.totalItems = action.payload.totalItems || 0;
        state.error = null;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      })
      .addCase(updateReview.pending, (state, action) => {
        const review = state.reviews?.find(
          (review) => review.id === action.meta.arg.id
        );
        if (review) {
          review.loading = true;
        }
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        const review = state.reviews?.find(
          (review) => review.id === action.payload.id
        );
        if (review) {
          review.loading = false;
          if (action.payload.dto.enabled !== undefined) {
            review.enabled = action.payload.dto.enabled;
          }
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update review";
        const review = state.reviews?.find(
          (review) => review.id === action.meta.arg.id
        );
        if (review) {
          review.loading = false;
        }
      });
  },
});

// --- Actions ---
export const {
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
} = reviewSlice.actions;

// --- Selectors ---
export const selectReviews = (state: RootState) => state.review.reviews;
export const selectReviewPage = (state: RootState) => state.review.page;
export const selectReviewPageSize = (state: RootState) => state.review.pageSize;
export const selectReviewTotalPages = (state: RootState) =>
  state.review.totalPages;
export const selectReviewTotalItems = (state: RootState) =>
  state.review.totalItems;
export const selectReviewLoading = (state: RootState) => state.review.loading;
export const selectReviewError = (state: RootState) => state.review.error;

export const selectReviewSearchTerm = (state: RootState) =>
  state.review.searchTerm;
export const selectReviewSentimentsFilter = (state: RootState) =>
  state.review.sentimentsFilter;
export const selectReviewExperiencesFilter = (state: RootState) =>
  state.review.experiencesFilter;
export const selectReviewIntentsFilter = (state: RootState) =>
  state.review.intentsFilter;
export const selectReviewDepthsFilter = (state: RootState) =>
  state.review.depthsFilter;
export const selectReviewPlatformsFilter = (state: RootState) =>
  state.review.platformsFilter;
export const selectReviewCategoriesFilter = (state: RootState) =>
  state.review.categoriesFilter;
export const selectReviewEnabledFilter = (state: RootState) =>
  state.review.enabledFilter;
export const selectReviewIncludeDeleted = (state: RootState) =>
  state.review.includeDeleted;
export const selectReviewProductIdFilter = (state: RootState) =>
  state.review.productIdFilter;
export const selectReviewProductSlugFilter = (state: RootState) =>
  state.review.productSlugFilter;
export const selectReviewUserIdFilter = (state: RootState) =>
  state.review.userIdFilter;
export const selectReviewDateRange = (state: RootState) =>
  state.review.dateRange;
export const selectReviewMinScore = (state: RootState) =>
  state.review.minReviewScore;
export const selectReviewSortBy = (state: RootState) => state.review.sortBy;
export const selectReviewOrder = (state: RootState) => state.review.order;

export const selectReviewCategories = (state: RootState) =>
  state.review.categories;
export const selectReviewCategoriesLoading = (state: RootState) =>
  state.review.categoriesLoading;

export default reviewSlice.reducer;
