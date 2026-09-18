import { notFound } from "next/navigation";
import { getUserById } from "@/api-actions/user/get-user";
import { UserDetailsHydrator } from "@/components/user/details/UserDetailsHydrator";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { requireSuperadmin } from "@/components/user/require-superadmin";
import { routes } from "@/utils/routes";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await requireSuperadmin())) {
    notFound();
  }

  const user = await getUserById(id);
  const title = user?.name || user?.email || "User details";

  const breadcrumbs = [
    { label: "Home", href: routes.dashboard.root },
    { label: "Users", href: routes.users.list },
    { label: title },
  ];

  return (
    <CommonPage>
      <PageHeader title={title} breadcrumbs={breadcrumbs} />

      <UserDetailsHydrator user={user} />
    </CommonPage>
  );
}
