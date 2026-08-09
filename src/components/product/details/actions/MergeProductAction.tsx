"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import {
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Portal,
  Stack,
  Text,
} from "@mantine/core";
import { VscGitMerge } from "react-icons/vsc";
import { mergeProduct } from "@/api-actions/product/product-merge";
import { ProductModel } from "@/models/product-model";
import { ProductTable } from "@/components/product/product-table";
import { routes } from "@/utils/routes";

type MergeStep = "selecting" | "confirming";

export const MergeProductAction = ({
  sourceProduct,
}: {
  sourceProduct: ProductModel;
}) => {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<MergeStep>("selecting");
  const [targetProduct, setTargetProduct] = useState<ProductModel | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setStep("selecting");
    setTargetProduct(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setTargetProduct(null);
    setStep("selecting");
  };

  const handleSelectTarget = (product: ProductModel) => {
    if (product.id === sourceProduct.id) {
      notifications.show({
        title: "Invalid selection",
        message: "Cannot merge a product into itself",
        color: "orange",
      });
      return;
    }
    setTargetProduct(product);
    setStep("confirming");
  };

  const handleBack = () => {
    setTargetProduct(null);
    setStep("selecting");
  };

  const handleConfirm = async () => {
    if (!targetProduct) return;

    setLoading(true);
    try {
      await mergeProduct(sourceProduct.id, targetProduct.id);

      notifications.show({
        title: "Success",
        message: `"${sourceProduct.displayName}" has been merged into "${targetProduct.displayName}"`,
        color: "green",
      });

      handleClose();
      router.push(routes.products.details(targetProduct.id));
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to merge products",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        leftSection={<VscGitMerge size={16} />}
        onClick={handleOpen}
        color="orange"
      >
        Merge into product
      </Button>

      <Portal reuseTargetNode={false}>
        <Modal
          opened={modalOpen}
          onClose={handleClose}
          title="Merge into product"
          centered
          size="90%"
        >
          <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
          />

          {step === "selecting" && (
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Select the target product. &quot;{sourceProduct.displayName}
                &quot; will be merged into the selected product and then
                deleted.
              </Text>
              <ProductTable
                onSelectProduct={handleSelectTarget}
                showProductDetailsLink={false}
                initialSearchTerm={sourceProduct.displayName}
                initialCategoryId={sourceProduct.productCategory?.id}
                initialBrandId={sourceProduct.brand?.id}
              />
            </Stack>
          )}

          {step === "confirming" && targetProduct && (
            <Stack gap="md">
              <Text fw={500}>Confirm merge</Text>
              <Text size="sm">
                All reviews, product references, images, sources, and aliases
                from:
              </Text>
              <Text fw={600} c="red">
                {sourceProduct.displayName}
              </Text>
              <Text size="sm">will be merged into:</Text>
              <Text fw={600} c="green">
                {targetProduct.displayName}
              </Text>
              <Text size="sm" c="dimmed">
                The source product will be permanently deleted. This action
                cannot be undone.
              </Text>

              <Group justify="flex-end">
                <Button variant="default" onClick={handleBack}>
                  Back
                </Button>
                <Button color="red" loading={loading} onClick={handleConfirm}>
                  Merge and delete source
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </Portal>
    </>
  );
};
