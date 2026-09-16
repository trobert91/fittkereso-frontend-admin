import { ListPage } from "@/components/list/list-page";
import { routes } from "@/utils/routes";
import { TaskTable } from "@/components/tasks/task-table";

export const metadata = {
  title: "fittkereso Admin Tasks",
  description: "fittkereso admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Tasks" },
];

export default function TaskListPage() {
  return (
    <ListPage title="Tasks" breadcrumbs={breadcrumbs}>
      <TaskTable />
    </ListPage>
  );
}
