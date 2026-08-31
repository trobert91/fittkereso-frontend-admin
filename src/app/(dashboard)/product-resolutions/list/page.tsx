"use client";

import { useRef } from "react";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { ProductResolutionTable, ProductResolutionTableRef } from "@/components/product-resolutions/resolution-table";
import { TriggerDetectionModal } from "@/components/product-resolutions/trigger-detection-modal";
import { routes } from "@/utils/routes";

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Product Resolutions" },
];

export default function ProductResolutionsPage() {
  const tableRef = useRef<ProductResolutionTableRef>(null);

  return (
    <CommonPage>
      <PageHeader
        title="Product Resolutions"
        breadcrumbs={breadcrumbs}
        actions={
          <TriggerDetectionModal
            onComplete={() => tableRef.current?.refresh()}
          />
        }
      />

      <ProductResolutionTable ref={tableRef} />
    </CommonPage>
  );
}
