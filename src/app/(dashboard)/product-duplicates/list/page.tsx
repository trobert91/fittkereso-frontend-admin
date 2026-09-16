import { ListPage } from "@/components/list/list-page";
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
    <ListPage
      title="Duplicates"
      breadcrumbs={breadcrumbs}
      actions={<ProductDuplicateScanAction />}
    >
      <ProductDuplicateTable />
    </ListPage>
  );
}
