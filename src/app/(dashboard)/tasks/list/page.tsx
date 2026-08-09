import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";
import { TaskTable } from "@/components/tasks/task-table";

export const metadata = {
  title: "ebike Admin Tasks",
  description: "ebike admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Tasks" },
];

export default function TaskListPage() {
  return (
    <CommonPage>
      <PageHeader title="Tasks" breadcrumbs={breadcrumbs} />

      <TaskTable />
    </CommonPage>
  );
}
