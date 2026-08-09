import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { Thread } from "@/models/thread";

// --- State type ---
interface ThreadState {
  thread: Thread | null;
  loading: boolean;
  error: string | null;
}

// --- Initial state ---
const initialState: ThreadState = {
  thread: null,
  loading: false,
  error: null,
};

// --- Slice ---
export const threadSlice = createSlice({
  name: "thread",
  initialState,
  reducers: {
    setThread: (state, action: PayloadAction<Thread | null>) => {
      state.thread = action.payload;
    },
    clearThread: (state) => {
      state.thread = null;
      state.error = null;
    },
  },
});

// --- Actions ---
export const { setThread, clearThread } = threadSlice.actions;

// --- Selectors ---
export const selectThread = (state: RootState) => state.thread.thread;
export const selectThreadId = (state: RootState) => state.thread.thread?.id;
export const selectThreadLoading = (state: RootState) => state.thread.loading;
export const selectThreadError = (state: RootState) => state.thread.error;

export default threadSlice.reducer;
