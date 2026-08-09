"use client";

import { useRef } from "react";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { ProductDuplicationTable, ProductDuplicationTableRef } from "@/components/product-duplications/product-duplication-table";
import { TriggerDetectionModal } from "@/components/product-duplications/trigger-detection-modal";
import { routes } from "@/utils/routes";

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Product Duplications" },
];

export default function ProductDuplicationsPage() {
  const tableRef = useRef<ProductDuplicationTableRef>(null);

  return (
    <CommonPage>
      <PageHeader
        title="Product Duplications"
        breadcrumbs={breadcrumbs}
        actions={
          <TriggerDetectionModal
            onComplete={() => tableRef.current?.refresh()}
          />
        }
      />

      <ProductDuplicationTable ref={tableRef} />
    </CommonPage>
  );
}
