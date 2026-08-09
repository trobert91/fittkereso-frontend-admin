import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";
import { CommentTable } from "@/components/comment/comment-table";

export const metadata = {
  title: "ebike Admin Comments",
  description: "ebike admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Comments" },
];

export default function CommentListPage() {
  return (
    <CommonPage>
      <PageHeader title="Comments" breadcrumbs={breadcrumbs} />

      <CommentTable />
    </CommonPage>
  );
}
