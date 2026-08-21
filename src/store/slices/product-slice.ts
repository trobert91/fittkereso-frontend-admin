import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { ProductModel } from "@/models/product-model";
import { ProductModelUpdateDto } from "@/models/dtos/product-model-update.dto";
import {
  postProductSpecUpdate,
  postProductUpdate,
} from "@/api-actions/product/product-update";
import {
  postProductImageOrder,
  sendDeleteProductImage,
} from "@/api-actions/product/product-image";
import {
  postCreateAlias,
  putUpdateAlias,
  sendDeleteAlias,
} from "@/api-actions/product/product-alias";
import { ProductSpecs } from "@/models/product-specs";
import { ProductSpecUpdateDto } from "@/models/dtos/product-spec-update.dto";

// --- State type ---
interface ProductState {
  product: ProductModel | null;
  manualSpecs: ProductSpecs | null;
  loading: boolean;
  saveInProgress?: boolean;
  error: string | null;
}

// --- Initial state ---
const initialState: ProductState = {
  product: null,
  manualSpecs: null,
  loading: false,
  saveInProgress: false,
  error: null,
};

// --- Async thunk ---
export const updateProduct = createAsyncThunk<
  ProductModel, // Returned product
  { id: string; data: ProductModelUpdateDto }, // Payload
  { rejectValue: string }
>("product/updateProduct", async ({ id, data }, thunkApi) => {
  try {
    return await postProductUpdate(id, data);
  } catch (err: any) {
    return thunkApi.rejectWithValue("Failed to update product");
  }
});
export const updateProductImageOrder = createAsyncThunk<
  ProductModel,
  { id: string; newOrder: { id: string; order: number }[] }, // payload
  { rejectValue: string }
>("product/updateProductImageOrder", async ({ id, newOrder }, thunkApi) => {
  try {
    const result = await postProductImageOrder(id, newOrder);
    return result;
  } catch (err: any) {
    return thunkApi.rejectWithValue("Failed to reorder images");
  }
});
export const deleteProductImage = createAsyncThunk<
  ProductModel,
  { productId: string; imageId: string }, // payload
  { rejectValue: string }
>("product/deleteProductImage", async ({ productId, imageId }, thunkApi) => {
  try {
    const result = await sendDeleteProductImage(productId, imageId);
    return result;
  } catch (err: any) {
    return thunkApi.rejectWithValue("Failed to reorder images");
  }
});
export const updateProductManualSpecs = createAsyncThunk<
  ProductModel, // return type
  { id: string; data: ProductSpecUpdateDto }, // payload
  { rejectValue: string }
>("product/updateProductManualSpecs", async ({ id, data }, thunkApi) => {
  try {
    return await postProductSpecUpdate(id, data);
  } catch (err: any) {
    return thunkApi.rejectWithValue(
      err?.message || "Failed to update manual specs"
    );
  }
});

export const createAlias = createAsyncThunk<
  ProductModel,
  { productId: string; alias: string },
  { rejectValue: string }
>("product/createAlias", async ({ productId, alias }, thunkApi) => {
  try {
    return await postCreateAlias(productId, alias);
  } catch (err: any) {
    return thunkApi.rejectWithValue("Failed to create alias");
  }
});

export const updateAlias = createAsyncThunk<
  ProductModel,
  { productId: string; aliasId: string; alias: string },
  { rejectValue: string }
>("product/updateAlias", async ({ productId, aliasId, alias }, thunkApi) => {
  try {
    return await putUpdateAlias(productId, aliasId, alias);
  } catch (err: any) {
    return thunkApi.rejectWithValue("Failed to update alias");
  }
});

export const deleteAlias = createAsyncThunk<
  ProductModel,
  { productId: string; aliasId: string },
  { rejectValue: string }
>("product/deleteAlias", async ({ productId, aliasId }, thunkApi) => {
  try {
    return await sendDeleteAlias(productId, aliasId);
  } catch (err: any) {
    return thunkApi.rejectWithValue("Failed to delete alias");
  }
});

// --- Slice ---
export const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setProduct: (state, action: PayloadAction<ProductModel | null>) => {
      state.product = action.payload;
    },
    clearProduct: (state) => {
      state.product = null;
      state.error = null;
    },
    setManualSpecs: (state, action: PayloadAction<ProductSpecs | null>) => {
      state.manualSpecs = action.payload;
    },
    clearManualSpecs: (state) => {
      state.manualSpecs = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Update product ---
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload; // Updated product from backend
        state.error = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      })
      .addCase(updateProductImageOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductImageOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload; // Updated product from backend
        state.error = null;
      })
      .addCase(updateProductImageOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      })
      .addCase(deleteProductImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProductImage.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload; // Updated product from backend
        state.error = null;
      })
      .addCase(deleteProductImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      })
      // --- Alias management ---
      .addCase(createAlias.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAlias.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
        state.error = null;
      })
      .addCase(createAlias.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      })
      .addCase(updateAlias.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAlias.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
        state.error = null;
      })
      .addCase(updateAlias.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      })
      .addCase(deleteAlias.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAlias.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
        state.error = null;
      })
      .addCase(deleteAlias.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unexpected error";
      })
      // --- Update manual specs ---
      .addCase(updateProductManualSpecs.pending, (state) => {
        state.saveInProgress = true;
        state.error = null;
      })
      .addCase(updateProductManualSpecs.fulfilled, (state, action) => {
        state.saveInProgress = false;

        const product = action.payload;
        const manualSpecs =
          product.sources?.find((s) => !s.source)?.scrapedProduct?.specs ??
          null;

        state.product = product;
        state.manualSpecs = manualSpecs;

        state.error = null;
      })
      .addCase(updateProductManualSpecs.rejected, (state, action) => {
        state.saveInProgress = false;
        state.error = action.payload ?? "Unexpected error";
      });
  },
});

// --- Actions ---
export const { setProduct, clearProduct, setManualSpecs, clearManualSpecs } =
  productSlice.actions;

// --- Selectors ---
export const selectProduct = (state: RootState) => state.product.product;
export const selectProductLoading = (state: RootState) => state.product.loading;
export const selectProductSaveInProgress = (state: RootState) =>
  state.product.saveInProgress;
export const selectProductError = (state: RootState) => state.product.error;

export const selectManualSpecs = (state: RootState) =>
  state.product.manualSpecs;

export default productSlice.reducer;
