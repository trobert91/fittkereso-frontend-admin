import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";
import { ProductDuplicateTable } from "@/components/product-duplicates/product-duplicate-table";
import { ProductDuplicateScanAction } from "@/components/product-duplicates/product-duplicate-scan-action";

export const metadata = {
  title: "fittkereso Admin Duplicates",
  description: "fittkereso admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Duplicates" },
];

export default function ProductDuplicateListPage() {
  return (
    <CommonPage>
      <PageHeader
        title="Duplicates"
        breadcrumbs={breadcrumbs}
        actions={<ProductDuplicateScanAction />}
      />

      <ProductDuplicateTable />
    </CommonPage>
  );
}
