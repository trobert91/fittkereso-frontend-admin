import { ListPage } from "@/components/list/list-page";
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
    <ListPage
      title="Scrape Tasks"
      breadcrumbs={breadcrumbs}
      actions={<CreateScrapeTaskAction />}
    >
      <ScrapeTaskTable />
    </ListPage>
  );
}
