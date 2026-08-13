import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";
import { CategoryTable } from "@/components/category/category-table";

export const metadata = {
  title: "fittkereso Admin Categories",
  description: "fittkereso admin page",
};

const breadcrumbs = [
  { label: "Főoldal", href: routes.dashboard.root },
  { label: "Kategóriák" },
];

export default function CategoryList() {
  return (
    <CommonPage>
      <PageHeader title="Kategóriák" breadcrumbs={breadcrumbs} />

      <CategoryTable />
    </CommonPage>
  );
}
