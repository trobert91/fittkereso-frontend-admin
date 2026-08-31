"use client";

import { useRef } from "react";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import {
  ProductResolutionList,
  ProductResolutionListRef,
} from "@/components/product-resolutions/resolution-list";
import { TriggerDetectionModal } from "@/components/product-resolutions/trigger-detection-modal";
import { routes } from "@/utils/routes";

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Product Resolutions" },
];

export default function ProductResolutionsPage() {
  const listRef = useRef<ProductResolutionListRef>(null);

  return (
    <CommonPage>
      <PageHeader
        title="Product Resolutions"
        breadcrumbs={breadcrumbs}
        actions={
          <TriggerDetectionModal
            onComplete={() => listRef.current?.refresh()}
          />
        }
      />

      <ProductResolutionList ref={listRef} />
    </CommonPage>
  );
}
