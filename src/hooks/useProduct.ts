import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { ProductModel } from "@/models/product-model";
import { getProductById } from "@/api-actions/product/get-product";

/*
  If product needs to be fetched client side, otherwise simply use
  
  const { id } = await params;
  const product = await getProductById(id);

  on the server side
*/
export const useProduct = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductModel | null>(null);

  const fetchProduct = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProductById(id);

      if (!response) {
        throw new Error("Failed to fetch product");
      }

      setProduct(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      notifications.show({
        color: "red",
        title: errorMessage,
        message: "Product fetch failed",
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchProduct,
    loading,
    error,
    product,
  };
};
