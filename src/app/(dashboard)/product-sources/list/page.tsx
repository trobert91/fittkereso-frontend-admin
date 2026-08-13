import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { ProductSourceTable } from "@/components/product-sources/product-source-table";
import { routes } from "@/utils/routes";

export const metadata = {
  title: "fittkereso Admin Product Sources",
  description: "fittkereso admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Product Sources" },
];

export default function ProductSourceListPage() {
  return (
    <CommonPage>
      <PageHeader title="Product Sources" breadcrumbs={breadcrumbs} />

      <ProductSourceTable />
    </CommonPage>
  );
}
