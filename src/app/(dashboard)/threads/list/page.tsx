import { Group } from "@mantine/core";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";
import { ThreadTable } from "@/components/threads/thread-table";
import { CreateThreadAction } from "@/components/threads/create-thread-action";
import { ThreadRelevanceDebugAction } from "@/components/threads/relevance-debug-action";
import { KeywordResearchDebugAction } from "@/components/threads/keyword-research-debug-action";
import { ThreadFlowInfoAction } from "@/components/threads/thread-flow-info-action";

export const metadata = {
  title: "ebike Admin Threads",
  description: "ebike admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Threads" },
];

export default function ThreadListPage() {
  return (
    <CommonPage>
      <PageHeader
        title="Threads"
        breadcrumbs={breadcrumbs}
        actions={
          <Group gap="sm">
            <ThreadFlowInfoAction />
            <ThreadRelevanceDebugAction />
            <KeywordResearchDebugAction />
            <CreateThreadAction />
          </Group>
        }
      />

      <ThreadTable />
    </CommonPage>
  );
}
