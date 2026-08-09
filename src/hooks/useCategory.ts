import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { ProductCategory } from "@/models/product-category";
import { getCategoryById } from "@/api-actions/category/get-category";

/*
  If product needs to be fetched client side, otherwise simply use
  
  const { id } = await params;
  const product = await getProductById(id);

  on the server side
*/
export const useCategory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ProductCategory | null>(null);

  const fetchCategory = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCategoryById(id);

      if (!response) {
        throw new Error("Failed to fetch product");
      }

      setCategory(response);
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
    fetchCategory,
    loading,
    error,
    category,
  };
};
