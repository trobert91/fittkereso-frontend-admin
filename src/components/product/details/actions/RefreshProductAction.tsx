"use client";

import { useState } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IoMdRefresh } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { selectProduct, setProduct } from "@/store/slices/product-slice";
import { getProductById } from "@/api-actions/product/get-product";

export function RefreshProductAction() {
  const product = useSelector(selectProduct);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  if (!product) {
    return null;
  }

  const onRefresh = async () => {
    setLoading(true);
    try {
      const updatedProduct = await getProductById(product.id);
      dispatch(setProduct(updatedProduct));
      notifications.show({
        title: "Refreshed",
        message: "Product data refreshed",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to refresh product",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip label="Refresh product data">
      <ActionIcon
        variant="default"
        size="lg"
        onClick={onRefresh}
        loading={loading}
      >
        <IoMdRefresh size={18} />
      </ActionIcon>
    </Tooltip>
  );
}
