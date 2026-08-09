import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";
import { ReviewTable } from "@/components/review/review-table";

export const metadata = {
  title: "ebike Admin Reviews",
  description: "ebike admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Reviews" },
];

export default function ReviewListPage() {
  return (
    <CommonPage>
      <PageHeader title="Reviews" breadcrumbs={breadcrumbs} />

      <ReviewTable />
    </CommonPage>
  );
}
