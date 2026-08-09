import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { cloneDeep } from "lodash";
import { UserComment } from "@/models/user-comment";
import {
  ProductReference,
  ProductReferenceUpdatePayload,
} from "@/models/product-reference";
import {
  updateCommentStatus,
  updateComment,
  toggleCommentChecked,
  retryComment,
} from "./comment-slice";

interface ThreadCommentState {
  comments: UserComment[] | null;
}

const initialState: ThreadCommentState = {
  comments: null,
};

const findCommentIndexById = (
  id: string,
  comments: UserComment[] | null,
): number => {
  return comments?.findIndex((comment) => comment.id === id) ?? -1;
};

export const threadCommentSlice = createSlice({
  name: "threadComment",
  initialState,
  reducers: {
    setThreadComments: (state, action: PayloadAction<UserComment[] | null>) => {
      state.comments = action.payload;
    },
    clearThreadComments: (state) => {
      state.comments = null;
    },
    changeThreadComment: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<UserComment> }>,
    ) => {
      const index = findCommentIndexById(action.payload.id, state.comments);
      if (index < 0 || !state.comments) return;

      const comment = cloneDeep(state.comments[index]);

      if (!comment.originalState) {
        const { originalState: _ignored, ...snapshot } = comment;
        comment.originalState = cloneDeep(snapshot) as UserComment;
      }

      state.comments[index] = {
        ...comment,
        ...action.payload.changes,
      } as UserComment;
    },
    undoThreadCommentChanges: (
      state,
      action: PayloadAction<{ id: string }>,
    ) => {
      const index = findCommentIndexById(action.payload.id, state.comments);
      if (state.comments && index >= 0) {
        const original = state.comments[index].originalState;
        if (original) {
          state.comments[index] = { ...original } as UserComment;
        }
      }
    },
    changeThreadProductReference: (
      state,
      action: PayloadAction<{
        commentId: string;
        productReference: ProductReferenceUpdatePayload;
      }>,
    ) => {
      const index = findCommentIndexById(
        action.payload.commentId,
        state.comments,
      );
      if (index < 0 || !state.comments) return;

      const comment = cloneDeep(state.comments[index]);
      if (!comment.productReferences) return;

      if (!comment.originalState) {
        const { originalState: _ignored, ...snapshot } = comment;
        comment.originalState = cloneDeep(snapshot) as UserComment;
      }

      const refIndex = comment.productReferences.findIndex(
        (ref) => ref.id === action.payload.productReference.id,
      );

      if (refIndex === -1) return;

      comment.productReferences[refIndex] = {
        ...comment.productReferences[refIndex],
        ...action.payload.productReference,
      } as ProductReference;

      state.comments[index] = comment;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateCommentStatus.pending, (state, action) => {
        const index = findCommentIndexById(
          action.meta.arg.id,
          state.comments,
        );
        if (state.comments && index >= 0) {
          state.comments[index].loading = true;
        }
      })
      .addCase(updateCommentStatus.fulfilled, (state, action) => {
        const index = findCommentIndexById(action.payload.id, state.comments);
        if (state.comments && index >= 0) {
          state.comments[index] = action.payload;
        }
      })
      .addCase(updateCommentStatus.rejected, (state, action) => {
        const index = findCommentIndexById(
          action.meta.arg.id,
          state.comments,
        );
        if (state.comments && index >= 0) {
          state.comments[index].loading = false;
        }
      })
      .addCase(updateComment.pending, (state, action) => {
        const index = findCommentIndexById(
          action.meta.arg.id,
          state.comments,
        );
        if (state.comments && index >= 0) {
          state.comments[index].loading = true;
        }
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const index = findCommentIndexById(action.payload.id, state.comments);
        if (state.comments && index >= 0) {
          state.comments[index] = action.payload;
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        const index = findCommentIndexById(
          action.meta.arg.id,
          state.comments,
        );
        if (state.comments && index >= 0) {
          state.comments[index].loading = false;
        }
      })
      .addCase(toggleCommentChecked.pending, (state, action) => {
        const index = findCommentIndexById(
          action.meta.arg.id,
          state.comments,
        );
        if (state.comments && index >= 0) {
          state.comments[index].loading = true;
        }
      })
      .addCase(toggleCommentChecked.fulfilled, (state, action) => {
        const index = findCommentIndexById(action.payload.id, state.comments);
        if (state.comments && index >= 0) {
          state.comments[index] = action.payload;
        }
      })
      .addCase(toggleCommentChecked.rejected, (state, action) => {
        const index = findCommentIndexById(
          action.meta.arg.id,
          state.comments,
        );
        if (state.comments && index >= 0) {
          state.comments[index].loading = false;
        }
      })
      .addCase(retryComment.pending, (state, action) => {
        const index = findCommentIndexById(action.meta.arg.id, state.comments);
        if (state.comments && index >= 0) {
          state.comments[index].loading = true;
        }
      })
      .addCase(retryComment.fulfilled, (state, action) => {
        const index = findCommentIndexById(action.payload.id, state.comments);
        if (state.comments && index >= 0) {
          state.comments[index] = action.payload;
        }
      })
      .addCase(retryComment.rejected, (state, action) => {
        const index = findCommentIndexById(action.meta.arg.id, state.comments);
        if (state.comments && index >= 0) {
          state.comments[index].loading = false;
        }
      });
  },
});

export const {
  setThreadComments,
  clearThreadComments,
  changeThreadComment,
  undoThreadCommentChanges,
  changeThreadProductReference,
} = threadCommentSlice.actions;

export const selectThreadComments = (state: RootState) =>
  state.threadComment.comments;

export default threadCommentSlice.reducer;
