import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/auth-slice";
import brandReducer from "./slices/brand-slice";
import categoryReducer from "./slices/category-slice";
import productReducer from "./slices/product-slice";
import productSourceReducer from "./slices/product-source-slice";
import sellerReducer from "./slices/seller-slice";
import storage from "redux-persist/lib/storage"; // localStorage for web
import { persistReducer, persistStore } from "redux-persist";

// 1️⃣ Persist configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // which reducers you want to persist
};

// 2️⃣ Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  brand: brandReducer,
  product: productReducer,
  category: categoryReducer,
  productSource: productSourceReducer,
  seller: sellerReducer,
});

// 3️⃣ Wrap reducer in persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4️⃣ Create store with devtools toggle
export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV === "development",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});

// 5️⃣ Create persistor for <PersistGate/>
export const persistor = persistStore(store);

// Infer state & dispatch types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
