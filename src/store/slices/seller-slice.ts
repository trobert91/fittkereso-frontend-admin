import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { Seller } from "@/models/seller";
import { SellerUpdateDto } from "@/models/dtos/seller-update.dto";
import { postSellerUpdate } from "@/api-actions/seller/seller-update";

// --- State type ---
interface SellerState {
  seller: Seller | null;
  loading: boolean;
  saveInProgress?: boolean;
  error: string | null;
}

// --- Initial state ---
const initialState: SellerState = {
  seller: null,
  loading: false,
  saveInProgress: false,
  error: null,
};

// --- Async thunk ---
export const updateSeller = createAsyncThunk<
  Seller,
  { id: string; data: SellerUpdateDto },
  { rejectValue: string }
>("seller/updateSeller", async ({ id, data }, thunkApi) => {
  try {
    return await postSellerUpdate(id, data);
  } catch (err: any) {
    return thunkApi.rejectWithValue("Failed to update seller");
  }
});

// --- Slice ---
export const sellerSlice = createSlice({
  name: "seller",
  initialState,
  reducers: {
    setSeller: (state, action: PayloadAction<Seller | null>) => {
      state.seller = action.payload;
    },
    clearSeller: (state) => {
      state.seller = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateSeller.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSeller.fulfilled, (state, action) => {
        state.loading = false;
        state.seller = action.payload;
        state.error = null;
      })
      .addCase(updateSeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      });
  },
});

// --- Actions ---
export const { setSeller, clearSeller } = sellerSlice.actions;

// --- Selectors ---
export const selectSeller = (state: RootState) => state.seller.seller;
export const selectSellerLoading = (state: RootState) => state.seller.loading;
export const selectSellerSaveInProgress = (state: RootState) =>
  state.seller.saveInProgress;
export const selectSellerError = (state: RootState) => state.seller.error;

export default sellerSlice.reducer;
