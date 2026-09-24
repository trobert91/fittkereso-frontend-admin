import { ListPage } from "@/components/list/list-page";
import { routes } from "@/utils/routes";
import { ProductImportTaskTable } from "@/components/product-import-tasks/product-import-task-table";
import { CreateProductImportTaskAction } from "@/components/product-import-tasks/create-product-import-task-action";

export const metadata = {
  title: "fittkereso Admin Import Tasks",
  description: "fittkereso admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Import Tasks" },
];

export default function ProductImportTaskListPage() {
  return (
    <ListPage
      title="Import Tasks"
      breadcrumbs={breadcrumbs}
      actions={<CreateProductImportTaskAction />}
    >
      <ProductImportTaskTable />
    </ListPage>
  );
}
