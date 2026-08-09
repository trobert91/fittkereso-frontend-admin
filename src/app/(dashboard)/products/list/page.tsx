import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { ProductTable } from "@/components/product/product-table";
import { routes } from "@/utils/routes";

export const metadata = {
  title: "ebike Admin Index page",
  description: "ebike admin page",
};

const breadcrumbs = [
  { label: "Főoldal", href: routes.dashboard.root },
  { label: "Termékek" },
];

export default function ProductList() {
  return (
    <CommonPage>
      <PageHeader title="Termékek" breadcrumbs={breadcrumbs} />

      <ProductTable syncWithUrl />
    </CommonPage>
  );
}
