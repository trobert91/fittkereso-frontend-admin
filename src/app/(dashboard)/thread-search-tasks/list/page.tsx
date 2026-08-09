import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";
import { ThreadSearchTaskTable } from "@/components/thread-search-tasks/thread-search-task-table";

export const metadata = {
  title: "ebike Admin Thread Search Tasks",
  description: "ebike admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Thread Search Tasks" },
];

export default function ThreadSearchTaskListPage() {
  return (
    <CommonPage>
      <PageHeader title="Thread Search Tasks" breadcrumbs={breadcrumbs} />

      <ThreadSearchTaskTable />
    </CommonPage>
  );
}
