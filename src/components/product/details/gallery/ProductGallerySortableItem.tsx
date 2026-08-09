"use client";

import { ProductImage } from "@/models/product-image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActionIcon, Box, Group, Paper } from "@mantine/core";
import Image from "next/image";
import { MdDelete } from "react-icons/md";

export default function ProductGallerySortableItem({
  id,
  image,
  onDelete,
  loading,
}: {
  id: string;
  image: ProductImage;
  onDelete: () => void;
  loading?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 12,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  };

  if (!image.url) return null;

  return (
    <Paper ref={setNodeRef} p="xs" style={style} withBorder>
      <Group align="center">
        {/* Drag handle */}
        <Box {...attributes} {...listeners} style={{ cursor: "grab" }}>
          ⣿
        </Box>

        {/* Image */}
        <Box
          style={{
            position: "relative",
            width: 200,
            height: 200,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <Image
            src={image.url}
            alt="Product image"
            fill
            style={{ objectFit: "contain" }}
          />
        </Box>

        {/* Delete button */}
        <ActionIcon loading={loading} color="red" onClick={onDelete}>
          <MdDelete size={20} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
