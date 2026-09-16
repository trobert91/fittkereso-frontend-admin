import { ListPage } from "@/components/list/list-page";
import { routes } from "@/utils/routes";
import { SellerTable } from "@/components/seller/seller-table";
import { CreateSellerAction } from "@/components/seller/create-seller-action";

export const metadata = {
  title: "fittkereso Admin Sellers",
  description: "fittkereso admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Sellers" },
];

export default function SellerList() {
  return (
    <ListPage
      title="Sellers"
      breadcrumbs={breadcrumbs}
      actions={<CreateSellerAction />}
    >
      <SellerTable />
    </ListPage>
  );
}
