import { getThreadById } from "@/api-actions/thread/get-thread";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { ThreadActions } from "@/components/thread-details/ThreadActions";
import { ThreadDetailsHydrator } from "@/components/thread-details/ThreadDetailsHydrator";
import { routes } from "@/utils/routes";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getThreadById(id);

  const breadcrumbs = [
    { label: "Főoldal", href: routes.dashboard.root },
    { label: "Threads", href: routes.threads.list },
    { label: thread?.title ?? "Thread details" },
  ];

  return (
    <CommonPage>
      <PageHeader
        title={thread?.title ?? "Thread details"}
        breadcrumbs={breadcrumbs}
        actions={<ThreadActions />}
      />

      <ThreadDetailsHydrator thread={thread} />
    </CommonPage>
  );
}
