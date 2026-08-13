import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";
import { ScrapeTaskTable } from "@/components/scrape-tasks/scrape-task-table";
import { CreateScrapeTaskAction } from "@/components/scrape-tasks/create-scrape-task-action";

export const metadata = {
  title: "fittkereso Admin Scrape Tasks",
  description: "fittkereso admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Scrape Tasks" },
];

export default function ScrapeTaskListPage() {
  return (
    <CommonPage>
      <PageHeader
        title="Scrape Tasks"
        breadcrumbs={breadcrumbs}
        actions={<CreateScrapeTaskAction />}
      />

      <ScrapeTaskTable />
    </CommonPage>
  );
}
