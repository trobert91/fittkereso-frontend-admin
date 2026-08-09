import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { Brand } from "@/models/brand";
import { BrandUpdateDto } from "@/models/dtos/brand-update.dto";
import { postBrandUpdate } from "@/api-actions/brand/brand-update";

// --- State type ---
interface BrandState {
  brand: Brand | null;
  loading: boolean;
  saveInProgress?: boolean;
  error: string | null;
}

// --- Initial state ---
const initialState: BrandState = {
  brand: null,
  loading: false,
  saveInProgress: false,
  error: null,
};

// --- Async thunk ---
export const updateBrand = createAsyncThunk<
  Brand,
  { id: string; data: BrandUpdateDto },
  { rejectValue: string }
>("brand/updateBrand", async ({ id, data }, thunkApi) => {
  try {
    return await postBrandUpdate(id, data);
  } catch (err: any) {
    return thunkApi.rejectWithValue("Failed to update brand");
  }
});

// --- Slice ---
export const brandSlice = createSlice({
  name: "brand",
  initialState,
  reducers: {
    setBrand: (state, action: PayloadAction<Brand | null>) => {
      state.brand = action.payload;
    },
    clearBrand: (state) => {
      state.brand = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.brand = action.payload;
        state.error = null;
      })
      .addCase(updateBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      });
  },
});

// --- Actions ---
export const { setBrand, clearBrand } = brandSlice.actions;

// --- Selectors ---
export const selectBrand = (state: RootState) => state.brand.brand;
export const selectBrandLoading = (state: RootState) => state.brand.loading;
export const selectBrandSaveInProgress = (state: RootState) =>
  state.brand.saveInProgress;
export const selectBrandError = (state: RootState) => state.brand.error;

export default brandSlice.reducer;
