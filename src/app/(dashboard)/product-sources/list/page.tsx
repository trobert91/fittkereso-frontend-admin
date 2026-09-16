import { ListPage } from "@/components/list/list-page";
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
    <ListPage title="Product Sources" breadcrumbs={breadcrumbs}>
      <ProductSourceTable />
    </ListPage>
  );
}
