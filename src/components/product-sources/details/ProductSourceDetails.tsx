"use client";

import { useState } from "react";
import { Button, Group, Stack } from "@mantine/core";
import { FaEdit } from "react-icons/fa";
import {
  selectProductSource,
  selectProductSourceLoading,
} from "@/store/slices/product-source-slice";
import { useAppSelector } from "@/store/store-hooks";
import { ProductSourceDetailsForm } from "./ProductSourceDetailsForm";
import { ProductSourceDetailsView } from "./ProductSourceDetailsView";

export function ProductSourceDetails() {
  const productSource = useAppSelector(selectProductSource);
  const loading = useAppSelector(selectProductSourceLoading);
  const [editing, setEditing] = useState(false);

  if (!productSource || loading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="md" mt="lg">
      {!editing && (
        <Group justify="flex-end">
          <Button
            leftSection={<FaEdit size={14} />}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        </Group>
      )}

      {editing ? (
        <ProductSourceDetailsForm onDone={() => setEditing(false)} />
      ) : (
        <ProductSourceDetailsView productSource={productSource} />
      )}
    </Stack>
  );
}
