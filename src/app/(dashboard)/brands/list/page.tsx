import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";
import { BrandTable } from "@/components/brand/brand-table";
import { CreateBrandAction } from "@/components/brand/create-brand-action";

export const metadata = {
  title: "ebike Admin Brands",
  description: "ebike admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Brands" },
];

export default function BrandList() {
  return (
    <CommonPage>
      <PageHeader
        title="Brands"
        breadcrumbs={breadcrumbs}
        actions={<CreateBrandAction />}
      />

      <BrandTable />
    </CommonPage>
  );
}
