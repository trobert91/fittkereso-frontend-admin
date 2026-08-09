"use client";

import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { FaCheck, FaPencilAlt, FaTimes, FaTrash } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "@/store/store-hooks";
import {
  createAlias,
  deleteAlias,
  selectProduct,
  selectProductLoading,
  updateAlias,
} from "@/store/slices/product-slice";
import { notifications } from "@mantine/notifications";
import { ProductAlias } from "@/models/product-alias";

const SOURCE_COLORS: Record<string, string> = {
  manual: "blue",
  scraped: "gray",
  auto_generated: "teal",
};

function AliasRow({ alias, productId }: { alias: ProductAlias; productId: string }) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectProductLoading);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(alias.alias);

  const handleDelete = async () => {
    const result = await dispatch(deleteAlias({ productId, aliasId: alias.id }));
    if (deleteAlias.rejected.match(result)) {
      notifications.show({ title: "Error", message: result.payload ?? "Failed to delete alias", color: "red" });
    }
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === alias.alias) {
      setEditing(false);
      setEditValue(alias.alias);
      return;
    }
    const result = await dispatch(updateAlias({ productId, aliasId: alias.id, alias: trimmed }));
    if (updateAlias.rejected.match(result)) {
      notifications.show({ title: "Error", message: result.payload ?? "Failed to update alias", color: "red" });
    } else {
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(alias.alias);
  };

  return (
    <Group gap="sm" align="center">
      {editing ? (
        <>
          <TextInput
            value={editValue}
            onChange={(e) => setEditValue(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            size="sm"
            style={{ flex: 1 }}
            autoFocus
          />
          <ActionIcon onClick={handleSave} loading={loading} color="green" variant="light" size="sm">
            <FaCheck size={12} />
          </ActionIcon>
          <ActionIcon onClick={handleCancel} color="gray" variant="light" size="sm">
            <FaTimes size={12} />
          </ActionIcon>
        </>
      ) : (
        <>
          <Text size="sm" style={{ flex: 1 }}>
            {alias.alias}
          </Text>
          <Badge size="xs" color={SOURCE_COLORS[alias.source] ?? "gray"} variant="light">
            {alias.source}
          </Badge>
          <ActionIcon
            onClick={() => setEditing(true)}
            color="blue"
            variant="subtle"
            size="sm"
          >
            <FaPencilAlt size={12} />
          </ActionIcon>
          <ActionIcon onClick={handleDelete} loading={loading} color="red" variant="subtle" size="sm">
            <FaTrash size={12} />
          </ActionIcon>
        </>
      )}
    </Group>
  );
}

export const ProductAliasesTab = () => {
  const dispatch = useAppDispatch();
  const product = useAppSelector(selectProduct);
  const loading = useAppSelector(selectProductLoading);
  const [newAlias, setNewAlias] = useState("");

  if (!product) return null;

  const handleAdd = async () => {
    const trimmed = newAlias.trim();
    if (!trimmed) return;
    const result = await dispatch(createAlias({ productId: product.id, alias: trimmed }));
    if (createAlias.rejected.match(result)) {
      notifications.show({ title: "Error", message: result.payload ?? "Failed to create alias", color: "red" });
    } else {
      setNewAlias("");
    }
  };

  return (
    <Stack gap="md" maw={800}>
      {product.aliases && product.aliases.length > 0 ? (
        <Stack gap="xs">
          {product.aliases.map((alias) => (
            <AliasRow key={alias.id} alias={alias} productId={product.id} />
          ))}
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          No aliases yet.
        </Text>
      )}

      <Group gap="sm" align="flex-end">
        <TextInput
          label="Add alias"
          placeholder="Enter alias name"
          value={newAlias}
          onChange={(e) => setNewAlias(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          style={{ flex: 1 }}
        />
        <Button onClick={handleAdd} loading={loading} disabled={!newAlias.trim()}>
          Add
        </Button>
      </Group>
    </Stack>
  );
};
