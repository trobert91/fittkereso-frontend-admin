import { ListPage } from "@/components/list/list-page";
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
    <ListPage title="Kategóriák" breadcrumbs={breadcrumbs}>
      <CategoryTable />
    </ListPage>
  );
}
