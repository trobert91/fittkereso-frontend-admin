import { ListPage } from "@/components/list/list-page";
import { routes } from "@/utils/routes";
import { BrandTable } from "@/components/brand/brand-table";
import { CreateBrandAction } from "@/components/brand/create-brand-action";

export const metadata = {
  title: "fittkereso Admin Brands",
  description: "fittkereso admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Brands" },
];

export default function BrandList() {
  return (
    <ListPage
      title="Brands"
      breadcrumbs={breadcrumbs}
      actions={<CreateBrandAction />}
    >
      <BrandTable />
    </ListPage>
  );
}
