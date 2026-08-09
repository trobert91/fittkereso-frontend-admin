"use client";

import { useEffect, useState } from "react";
import { Box, Button, Group, Modal, SimpleGrid, Text } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import ProductGallerySortableItem from "./ProductGallerySortableItem";
import { ProductModel } from "@/models/product-model";
import { ProductImage } from "@/models/product-image";
import { sortBy } from "lodash";
import { postProductImageUpload } from "@/api-actions/product/product-image";
import { notifications } from "@mantine/notifications";
import {
  deleteProductImage,
  selectProductLoading,
  updateProductImageOrder,
} from "@/store/slices/product-slice";
import { useAppDispatch } from "@/store/store-hooks";
import { useSelector } from "react-redux";

export default function ProductGalleryEditor({
  product,
}: {
  product: ProductModel;
}) {
  const dispatch = useAppDispatch();

  const { id: productId } = product;
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isUploading, setUploading] = useState(false);
  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteImageId, setPendingDeleteImageId] = useState<
    string | null
  >(null);
  const isLoading = useSelector(selectProductLoading);

  // ---------------------------
  // Load existing images
  // ---------------------------
  useEffect(() => {
    setImages(sortBy(product.images, "order"));
  }, [product]);

  // ---------------------------
  // Upload files
  // ---------------------------
  async function uploadFiles(files: File[]) {
    setUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const uploaded = await postProductImageUpload(productId, formData);
        setImages([...images, uploaded]);

        notifications.show({
          title: "Upload successful",
          message: `Image uploaded: ${file.name}`,
          color: "green",
        });
      } catch (err) {
        notifications.show({
          title: "Upload failed",
          message: `Failed to upload image: ${file.name}`,
          color: "red",
        });
      }
    }

    setUploading(false);
  }

  // ---------------------------
  // Open Delete Modal
  // ---------------------------
  function requestDelete(id: string) {
    setPendingDeleteImageId(id);
    setDeleteModalOpen(true);
  }

  // ---------------------------
  // Confirm Delete
  // ---------------------------
  function confirmDelete() {
    if (!pendingDeleteImageId) return;

    const imageId = pendingDeleteImageId;

    // Optimistic local removal
    setImages((prev) => prev.filter((i) => i.id !== imageId));

    dispatch(deleteProductImage({ productId, imageId }));

    setDeleteModalOpen(false);
    setPendingDeleteImageId(null);
  }

  // ---------------------------
  // Drag & Drop Sorting
  // ---------------------------
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);

    const newList = arrayMove(images, oldIndex, newIndex);

    dispatch(
      updateProductImageOrder({
        id: productId,
        newOrder: newList.map((img, index) => ({ id: img.id, order: index })),
      })
    );
  }

  return (
    <Box>
      {/* ---------------------- DROPZONE ---------------------- */}
      <Dropzone onDrop={uploadFiles} accept={["image/*"]} multiple>
        <Group
          justify="center"
          mih={120}
          style={{ pointerEvents: isUploading ? "none" : "auto" }}
        >
          {isUploading ? "Uploading..." : "Drop images here or click to select"}
        </Group>
      </Dropzone>

      {/* ---------------------- SORTABLE GALLERY ---------------------- */}
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={images.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <SimpleGrid
            mt="md"
            cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
            spacing="sm"
          >
            {images.map((img) => (
              <ProductGallerySortableItem
                key={img.id}
                id={img.id}
                image={img}
                onDelete={() => requestDelete(img.id)}
                loading={isLoading}
              />
            ))}
          </SimpleGrid>
        </SortableContext>
      </DndContext>

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Image?"
        centered
      >
        <Box mb="md">
          <Text>Are you sure you want to delete this image?</Text>
        </Box>

        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>

          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
