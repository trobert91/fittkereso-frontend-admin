import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";
import { ThreadSearchKeywordTable } from "@/components/thread-search-keywords/thread-search-keyword-table";

export const metadata = {
  title: "ebike Admin Thread Keywords",
  description: "ebike admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Thread Keywords" },
];

export default function ThreadKeywordsListPage() {
  return (
    <CommonPage>
      <PageHeader title="Thread Keywords" breadcrumbs={breadcrumbs} />

      <ThreadSearchKeywordTable />
    </CommonPage>
  );
}
