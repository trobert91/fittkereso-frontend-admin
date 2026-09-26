"use client";

import { useState } from "react";
import { Stack } from "@mantine/core";
import {
  selectProductSource,
  selectProductSourceLoading,
  setProductSource,
} from "@/store/slices/product-source-slice";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import { ProductSourceDetailsForm } from "./ProductSourceDetailsForm";
import { ProductSourceDetailsView } from "./ProductSourceDetailsView";
import { ProductSourceHistory } from "./ProductSourceHistory";
import { ProductSourceVersions } from "./ProductSourceVersions";

export function ProductSourceDetails() {
  const dispatch = useAppDispatch();
  const productSource = useAppSelector(selectProductSource);
  const loading = useAppSelector(selectProductSourceLoading);
  const [editing, setEditing] = useState(false);

  if (!productSource || loading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="md" mt="lg">
      {editing ? (
        <ProductSourceDetailsForm onDone={() => setEditing(false)} />
      ) : (
        <ProductSourceDetailsView
          productSource={productSource}
          onEdit={() => setEditing(true)}
        />
      )}

      {/* Three boxes, split by what each is for: the record above is what the
          source asks for now and where it is edited; the versions are every
          configuration it has ever had, and where an old one goes back into
          force; the history is everything that has happened to it.

          All three render from the one source in the store. A save or a restore
          answers with the whole source, history included, and putting that in
          the store re-renders every box at once — so none of them can be
          showing something the last write already moved past. The source's
          listings have their own page, linked from the header. */}
      <ProductSourceVersions
        productSource={productSource}
        onRestored={(updated) => dispatch(setProductSource(updated))}
      />

      <ProductSourceHistory productSource={productSource} />
    </Stack>
  );
}
