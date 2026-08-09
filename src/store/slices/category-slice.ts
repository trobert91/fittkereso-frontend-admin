import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { ProductCategory } from "@/models/product-category";
import { ProductCategoryUpdateDto } from "@/models/dtos/product-category-update.dto";
import { postCategoryUpdate } from "@/api-actions/category/category-update";
import { getCategoryById } from "@/api-actions/category/get-category";

export const CATEGORY_DETAILS_TTL_MS = 10 * 60 * 1000;

interface CategoryDetailsCacheEntry {
  details: ProductCategory;
  fetchedAt: number;
}

interface CategoryState {
  category: ProductCategory | null;
  loading: boolean;
  saveInProgress?: boolean;
  error: string | null;

  detailsById: Record<string, CategoryDetailsCacheEntry>;
  loadingIds: string[];
}

const initialState: CategoryState = {
  category: null,
  loading: false,
  saveInProgress: false,
  error: null,
  detailsById: {},
  loadingIds: [],
};

const isFresh = (entry: CategoryDetailsCacheEntry | undefined): boolean =>
  !!entry && Date.now() - entry.fetchedAt < CATEGORY_DETAILS_TTL_MS;

export const updateCategory = createAsyncThunk<
  ProductCategory,
  { id: string; data: ProductCategoryUpdateDto },
  { rejectValue: string }
>("category/updateCategory", async ({ id, data }, thunkApi) => {
  try {
    return await postCategoryUpdate(id, data);
  } catch (err: any) {
    return thunkApi.rejectWithValue("Failed to update category");
  }
});

export const fetchCategoryDetails = createAsyncThunk<
  ProductCategory | null,
  { id: string; force?: boolean },
  { state: RootState; rejectValue: string }
>(
  "category/fetchCategoryDetails",
  async ({ id, force }, thunkApi) => {
    const cached = thunkApi.getState().category.detailsById[id];
    if (!force && isFresh(cached)) {
      return null;
    }
    try {
      return await getCategoryById(id, { includeConfig: true });
    } catch (err: any) {
      return thunkApi.rejectWithValue(
        err?.message ?? "Failed to fetch category details",
      );
    }
  },
  {
    condition: ({ id, force }, { getState }) => {
      const state = getState().category;
      if (state.loadingIds.includes(id)) return false;
      if (!force && isFresh(state.detailsById[id])) return false;
      return true;
    },
  },
);

export const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    setCategory: (state, action: PayloadAction<ProductCategory | null>) => {
      state.category = action.payload;
    },
    clearCategory: (state) => {
      state.category = null;
      state.error = null;
    },
    invalidateCategoryDetails: (state, action: PayloadAction<string>) => {
      delete state.detailsById[action.payload];
    },
    invalidateAllCategoryDetails: (state) => {
      state.detailsById = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.category = action.payload;
        state.error = null;
        state.detailsById[action.payload.id] = {
          details: action.payload,
          fetchedAt: Date.now(),
        };
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      })

      .addCase(fetchCategoryDetails.pending, (state, action) => {
        const id = action.meta.arg.id;
        if (!state.loadingIds.includes(id)) {
          state.loadingIds.push(id);
        }
      })
      .addCase(fetchCategoryDetails.fulfilled, (state, action) => {
        const id = action.meta.arg.id;
        state.loadingIds = state.loadingIds.filter((x) => x !== id);
        if (action.payload) {
          state.detailsById[id] = {
            details: action.payload,
            fetchedAt: Date.now(),
          };
        }
      })
      .addCase(fetchCategoryDetails.rejected, (state, action) => {
        const id = action.meta.arg.id;
        state.loadingIds = state.loadingIds.filter((x) => x !== id);
      });
  },
});

export const {
  setCategory,
  clearCategory,
  invalidateCategoryDetails,
  invalidateAllCategoryDetails,
} = categorySlice.actions;

export const selectCategory = (state: RootState) => state.category.category;
export const selectCategoryLoading = (state: RootState) =>
  state.category.loading;
export const selectCategorySaveInProgress = (state: RootState) =>
  state.category.saveInProgress;
export const selectCategoryError = (state: RootState) => state.category.error;

export const selectCategoryDetailsById =
  (id: string | undefined) =>
  (state: RootState): ProductCategory | undefined =>
    id ? state.category.detailsById[id]?.details : undefined;

export const selectCategoryDetailsLoading =
  (id: string | undefined) =>
  (state: RootState): boolean =>
    id ? state.category.loadingIds.includes(id) : false;

export default categorySlice.reducer;
