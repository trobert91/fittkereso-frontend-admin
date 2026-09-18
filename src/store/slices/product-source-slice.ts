import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import { ProductSourceUpdateDto } from "@/models/dtos/product-source-update.dto";
import { putProductSourceUpdate } from "@/api-actions/product-source/product-source-update";

interface ProductSourceState {
  productSource: ProductSource | null;
  loading: boolean;
  saveInProgress?: boolean;
  error: string | null;
}

const initialState: ProductSourceState = {
  productSource: null,
  loading: false,
  saveInProgress: false,
  error: null,
};

export const updateProductSource = createAsyncThunk<
  ProductSource,
  { id: string; data: ProductSourceUpdateDto },
  { rejectValue: string }
>("productSource/updateProductSource", async ({ id, data }, thunkApi) => {
  try {
    return await putProductSourceUpdate(id, data);
  } catch (error) {
    // The API's own message is the useful one here — an invalid sync interval
    // or a bad config comes back as a specific 400, not a generic failure.
    return thunkApi.rejectWithValue(
      error instanceof Error ? error.message : "Failed to update product source",
    );
  }
});

export const productSourceSlice = createSlice({
  name: "productSource",
  initialState,
  reducers: {
    setProductSource: (state, action: PayloadAction<ProductSource | null>) => {
      state.productSource = action.payload;
    },
    clearProductSource: (state) => {
      state.productSource = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // A save flips saveInProgress, not loading: `loading` blanks the whole
      // details page out for a spinner, which would unmount the edit form
      // mid-submit and throw away what was typed.
      .addCase(updateProductSource.pending, (state) => {
        state.saveInProgress = true;
        state.error = null;
      })
      .addCase(updateProductSource.fulfilled, (state, action) => {
        state.saveInProgress = false;
        state.productSource = action.payload;
        state.error = null;
      })
      .addCase(updateProductSource.rejected, (state, action) => {
        state.saveInProgress = false;
        state.error = action.payload ?? "Unexpected error";
      });
  },
});

export const { setProductSource, clearProductSource } =
  productSourceSlice.actions;

export const selectProductSource = (state: RootState) =>
  state.productSource.productSource;
export const selectProductSourceLoading = (state: RootState) =>
  state.productSource.loading;
export const selectProductSourceSaveInProgress = (state: RootState) =>
  state.productSource.saveInProgress;
export const selectProductSourceError = (state: RootState) =>
  state.productSource.error;

export default productSourceSlice.reducer;
