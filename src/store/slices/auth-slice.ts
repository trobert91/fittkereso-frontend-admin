import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { AuthenticatedUser } from "@/models/user";
import { LoginPayload, postLogin, postLogout } from "@/api-actions/auth";

// -----------------------------
// ASYNC THUNKS
// -----------------------------
export const loginUser = createAsyncThunk<
  AuthenticatedUser, // return type
  LoginPayload, // argument type
  { rejectValue: string } // error type
>("auth/loginUser", async (payload, thunkApi) => {
  try {
    const response = await postLogin(payload);

    if (!response.user?.id) {
      return thunkApi.rejectWithValue("Invalid login response");
    }

    return response.user;
  } catch (err) {
    return thunkApi.rejectWithValue("Login failed");
  }
});

export const logoutUser = createAsyncThunk<
  void, // return type
  void, // no args
  { rejectValue: string } // error
>("auth/logoutUser", async (_, thunkApi) => {
  try {
    await postLogout();
  } catch {
    // Even if API fails, continue to clear local state
  }
});

// -----------------------------
// STATE
// -----------------------------
interface AuthState {
  loggedIn: boolean;
  user: AuthenticatedUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  loggedIn: false,
  user: null,
  loading: false,
  error: null,
};

// -----------------------------
// SLICE
// -----------------------------
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    // LOGIN
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.loggedIn = true;
    });

    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? "Login failed";
    });

    // LOGOUT
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.loggedIn = false;
      state.loading = false;
    });
  },
});

// SELECTORS
export const selectUser = (state: RootState) => state.auth.user;
export const selectLoggedIn = (state: RootState) => state.auth.loggedIn;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

// REDUCER EXPORT
export default authSlice.reducer;
