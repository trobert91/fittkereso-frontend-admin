import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { cloneDeep } from "lodash";
import { UserComment } from "@/models/user-comment";
import {
  ProductReference,
  ProductReferenceUpdatePayload,
} from "@/models/product-reference";
import { ProductCategory } from "@/models/product-category";
import { CommentStatus } from "@/models/enums/comment-enums";
import {
  CommentSearchParams,
  CommentSearchResult,
} from "@/models/dtos/comment-search-models";
import { postCommentSearch } from "@/api-actions/user-comment/comment-search";
import {
  postCommentStatusUpdate,
  postCommentToggleChecked,
} from "@/api-actions/user-comment/comment-status-update";
import { postCommentRetry } from "@/api-actions/user-comment/comment-retry";
import { postCommentUpdate } from "@/api-actions/user-comment/comment-update";
import { UpdateCommentDto } from "@/models/dtos/comment-update.dto";
import dayjs from "dayjs";

// --- State type ---
interface CommentState {
  comments: UserComment[] | null;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  loading: boolean;
  error: string | null;
  // Filter state
  statusesFilter: CommentStatus[];
  categoriesFilter: string[];
  searchTerm: string;
  externalId: string;
  threadId: string;
  authorId: string;
  parentExternalId: string;
  reviewedBy: string[];
  reviewer: string;
  dateRange: [string | null, string | null];
  sortBy: CommentSearchParams["sort"];
  order: CommentSearchParams["order"];
  // Category data (for use case prefill)
  categories: ProductCategory[];
  categoriesLoading: boolean;
}

// --- Initial state ---
const initialState: CommentState = {
  comments: null,
  page: 1,
  pageSize: 50,
  totalPages: 1,
  totalItems: 0,
  loading: false,
  error: null,
  // Filter initial state
  statusesFilter: [],
  categoriesFilter: [],
  searchTerm: "",
  externalId: "",
  threadId: "",
  authorId: "",
  parentExternalId: "",
  reviewedBy: [],
  reviewer: "all",
  dateRange: [dayjs().subtract(30, "days").toISOString(), dayjs().toISOString()],
  sortBy: "moderationPriority",
  order: "DESC",
  categories: [],
  categoriesLoading: true,
};

// --- Async thunk ---
export const fetchComments = createAsyncThunk<
  CommentSearchResult,
  CommentSearchParams,
  { rejectValue: string }
>("comment/fetchComments", async (params, thunkApi) => {
  try {
    return await postCommentSearch(params);
  } catch (err: any) {
    return thunkApi.rejectWithValue(err.message || "Failed to fetch comments");
  }
});

export const updateCommentStatus = createAsyncThunk<
  UserComment,
  { id: string; status: CommentStatus },
  { state: RootState; rejectValue: string }
>("comment/updateCommentStatus", async ({ id, status }, thunkApi) => {
  try {
    return await postCommentStatusUpdate(id, status);
  } catch (err: any) {
    return thunkApi.rejectWithValue(
      err.message || "Failed to update comment status"
    );
  }
});

export const updateComment = createAsyncThunk<
  UserComment,
  { id: string; dto: UpdateCommentDto },
  { state: RootState; rejectValue: string }
>("comment/updateComment", async ({ id, dto }, thunkApi) => {
  try {
    return await postCommentUpdate(id, dto);
  } catch (err: any) {
    return thunkApi.rejectWithValue(err.message || "Failed to update comment");
  }
});

export const toggleCommentChecked = createAsyncThunk<
  UserComment,
  { id: string },
  { state: RootState; rejectValue: string }
>("comment/toggleCommentChecked", async ({ id }, thunkApi) => {
  try {
    return await postCommentToggleChecked(id);
  } catch (err: any) {
    return thunkApi.rejectWithValue(
      err.message || "Failed to toggle comment checked"
    );
  }
});

export const retryComment = createAsyncThunk<
  UserComment,
  { id: string },
  { state: RootState; rejectValue: string }
>("comment/retryComment", async ({ id }, thunkApi) => {
  try {
    return await postCommentRetry(id);
  } catch (err: any) {
    return thunkApi.rejectWithValue(err.message || "Failed to retry comment");
  }
});

const findCommentById = (
  id: string,
  comments: UserComment[] | null
): UserComment | undefined => {
  return comments?.find((comment) => comment.id === id);
};

const findCommentIndexById = (
  id: string,
  comments: UserComment[] | null
): number => {
  return comments?.findIndex((comment) => comment.id === id) ?? -1;
};

// --- Slice ---
export const commentSlice = createSlice({
  name: "comment",
  initialState,
  reducers: {
    setComments: (state, action: PayloadAction<UserComment[] | null>) => {
      state.comments = action.payload;
    },
    clearComments: (state) => {
      state.comments = null;
      state.error = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1;
    },
    // Filter actions
    setStatusesFilter: (state, action: PayloadAction<CommentStatus[]>) => {
      state.statusesFilter = action.payload;
    },
    setCategoriesFilter: (state, action: PayloadAction<string[]>) => {
      state.categoriesFilter = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setExternalId: (state, action: PayloadAction<string>) => {
      state.externalId = action.payload;
    },
    setThreadId: (state, action: PayloadAction<string>) => {
      state.threadId = action.payload;
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
      action: PayloadAction<[string | null, string | null]>
    ) => {
      state.dateRange = action.payload;
    },
    setCategories: (state, action: PayloadAction<ProductCategory[]>) => {
      state.categories = action.payload;
    },
    setCategoriesLoading: (state, action: PayloadAction<boolean>) => {
      state.categoriesLoading = action.payload;
    },
    changeComment: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<UserComment> }>
    ) => {
      const index = findCommentIndexById(action.payload.id, state.comments);
      if (index < 0 || !state.comments) return;

      const comment = cloneDeep(state.comments[index]);

      // Preserve original state only once so we can undo later
      if (!comment.originalState) {
        const { originalState: _ignored, ...snapshot } = comment;
        comment.originalState = cloneDeep(snapshot) as UserComment;
      }

      state.comments[index] = {
        ...comment,
        ...action.payload.changes,
      } as UserComment;
    },
    undoCommentChanges: (state, action: PayloadAction<{ id: string }>) => {
      const index = findCommentIndexById(action.payload.id, state.comments);
      if (state.comments && index >= 0) {
        const original = state.comments[index].originalState;
        if (original) {
          state.comments[index] = { ...original } as UserComment;
        }
      }
    },
    changeProductReference: (
      state,
      action: PayloadAction<{
        commentId: string;
        productReference: ProductReferenceUpdatePayload;
      }>
    ) => {
      const index = findCommentIndexById(
        action.payload.commentId,
        state.comments
      );
      if (index < 0 || !state.comments) return;

      const comment = cloneDeep(state.comments[index]);
      if (!comment.productReferences) return;

      // Preserve original state only once
      if (!comment.originalState) {
        const { originalState: _ignored, ...snapshot } = comment;
        comment.originalState = cloneDeep(snapshot) as UserComment;
      }

      const refIndex = comment.productReferences.findIndex(
        (ref) => ref.id === action.payload.productReference.id
      );

      if (refIndex === -1) return;

      comment.productReferences[refIndex] = {
        ...comment.productReferences[refIndex],
        ...action.payload.productReference,
      } as ProductReference;

      state.comments[index] = comment;
    },
    setSortBy: (state, action: PayloadAction<CommentSearchParams["sort"]>) => {
      state.sortBy = action.payload;
    },
    setOrder: (state, action: PayloadAction<CommentSearchParams["order"]>) => {
      state.order = action.payload;
    },
    clearFilters: (state) => {
      state.statusesFilter = [];
      state.categoriesFilter = [];
      state.searchTerm = "";
      state.externalId = "";
      state.threadId = "";
      state.authorId = "";
      state.parentExternalId = "";
      state.reviewedBy = [];
      state.sortBy = "moderationPriority";
      state.order = "DESC";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload.items || [];
        state.totalPages = action.payload.totalPages || 1;
        state.totalItems = action.payload.totalItems || 0;
        state.error = null;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      })
      .addCase(updateCommentStatus.pending, (state, action) => {
        const comment = findCommentById(action.meta.arg.id, state.comments);
        if (comment) {
          comment.loading = true;
        }
      })
      .addCase(updateCommentStatus.fulfilled, (state, action) => {
        const updatedComment = action.payload;

        const index = findCommentIndexById(updatedComment.id, state.comments);
        if (state.comments && index >= 0) {
          state.comments[index] = updatedComment;
        }
      })
      .addCase(updateCommentStatus.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update comment status";

        const comment = findCommentById(action.meta.arg.id, state.comments);
        if (comment) {
          comment.loading = false;
        }
      })
      .addCase(updateComment.pending, (state, action) => {
        const comment = findCommentById(action.meta.arg.id, state.comments);
        if (comment) {
          comment.loading = true;
        }
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const updatedComment = action.payload;

        const index = findCommentIndexById(updatedComment.id, state.comments);
        if (state.comments && index >= 0) {
          state.comments[index] = updatedComment;
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update comment";

        const comment = findCommentById(action.meta.arg.id, state.comments);
        if (comment) {
          comment.loading = false;
        }
      })
      .addCase(toggleCommentChecked.pending, (state, action) => {
        const comment = findCommentById(action.meta.arg.id, state.comments);
        if (comment) {
          comment.loading = true;
        }
      })
      .addCase(toggleCommentChecked.fulfilled, (state, action) => {
        const updatedComment = action.payload;
        const index = findCommentIndexById(updatedComment.id, state.comments);
        if (state.comments && index >= 0) {
          state.comments[index] = updatedComment;
        }
      })
      .addCase(toggleCommentChecked.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to toggle comment checked";

        const comment = findCommentById(action.meta.arg.id, state.comments);
        if (comment) {
          comment.loading = false;
        }
      })
      .addCase(retryComment.pending, (state, action) => {
        const comment = findCommentById(action.meta.arg.id, state.comments);
        if (comment) {
          comment.loading = true;
        }
      })
      .addCase(retryComment.fulfilled, (state, action) => {
        const updatedComment = action.payload;
        const index = findCommentIndexById(updatedComment.id, state.comments);
        if (state.comments && index >= 0) {
          state.comments[index] = updatedComment;
        }
      })
      .addCase(retryComment.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to retry comment";

        const comment = findCommentById(action.meta.arg.id, state.comments);
        if (comment) {
          comment.loading = false;
        }
      });
  },
});

// --- Actions ---
export const {
  setComments,
  clearComments,
  setPage,
  setPageSize,
  setStatusesFilter,
  setCategoriesFilter,
  setSearchTerm,
  setExternalId,
  setThreadId,
  setAuthorId,
  setParentExternalId,
  setReviewedBy,
  setReviewer,
  setDateRange,
  setCategories,
  setCategoriesLoading,
  changeComment,
  undoCommentChanges,
  changeProductReference,
  setSortBy,
  setOrder,
  clearFilters,
} = commentSlice.actions;

// --- Selectors ---
export const selectComments = (state: RootState) => state.comment.comments;
export const selectPage = (state: RootState) => state.comment.page;
export const selectPageSize = (state: RootState) => state.comment.pageSize;
export const selectTotalPages = (state: RootState) => state.comment.totalPages;
export const selectTotalItems = (state: RootState) => state.comment.totalItems;
export const selectCommentLoading = (state: RootState) => state.comment.loading;
export const selectCommentError = (state: RootState) => state.comment.error;

// Filter selectors
export const selectStatusesFilter = (state: RootState) =>
  state.comment.statusesFilter;
export const selectCategoriesFilter = (state: RootState) =>
  state.comment.categoriesFilter;
export const selectSearchTerm = (state: RootState) => state.comment.searchTerm;
export const selectExternalId = (state: RootState) => state.comment.externalId;
export const selectThreadId = (state: RootState) => state.comment.threadId;
export const selectAuthorId = (state: RootState) => state.comment.authorId;
export const selectParentExternalId = (state: RootState) =>
  state.comment.parentExternalId;
export const selectReviewedBy = (state: RootState) => state.comment.reviewedBy;
export const selectReviewer = (state: RootState) => state.comment.reviewer;
export const selectDateRange = (state: RootState) => state.comment.dateRange;
export const selectSortBy = (state: RootState) => state.comment.sortBy;
export const selectOrder = (state: RootState) => state.comment.order;

// Category selectors
export const selectCategories = (state: RootState) =>
  state.comment.categories;
export const selectCategoriesLoading = (state: RootState) =>
  state.comment.categoriesLoading;

export default commentSlice.reducer;
