import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { AdminUser } from "@/models/admin-user";
import { UserUpdateDto } from "@/models/dtos/user-update.dto";
import { patchUserUpdate } from "@/api-actions/user/user-update";

// --- State type ---
interface UserState {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
}

// --- Initial state ---
const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

// --- Async thunk ---
export const updateUser = createAsyncThunk<
  AdminUser,
  { id: string; data: UserUpdateDto },
  { rejectValue: string }
>("user/updateUser", async ({ id, data }, thunkApi) => {
  try {
    return await patchUserUpdate(id, data);
  } catch (err) {
    // Surface the API's own wording - it distinguishes a duplicate email from
    // a rejected role change, and a generic message would lose that.
    return thunkApi.rejectWithValue(
      err instanceof Error ? err.message : "Failed to update user"
    );
  }
});

// --- Slice ---
export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AdminUser | null>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      });
  },
});

// --- Actions ---
export const { setUser, clearUser } = userSlice.actions;

// --- Selectors ---
export const selectUserEntity = (state: RootState) => state.user.user;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

export default userSlice.reducer;
