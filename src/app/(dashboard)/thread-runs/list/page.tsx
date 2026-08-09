import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { ThreadRunTable } from "@/components/thread-runs/thread-run-table";
import { routes } from "@/utils/routes";

export const metadata = {
  title: "ebike Admin Thread Runs",
  description: "ebike admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Thread Runs" },
];

export default function ThreadRunListPage() {
  return (
    <CommonPage>
      <PageHeader title="Thread Runs" breadcrumbs={breadcrumbs} />
      <ThreadRunTable />
    </CommonPage>
  );
}
