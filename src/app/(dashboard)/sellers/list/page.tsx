import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
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
    <CommonPage>
      <PageHeader
        title="Sellers"
        breadcrumbs={breadcrumbs}
        actions={<CreateSellerAction />}
      />

      <SellerTable />
    </CommonPage>
  );
}
