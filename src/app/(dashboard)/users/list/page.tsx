import { notFound } from "next/navigation";
import { ListPage } from "@/components/list/list-page";
import { routes } from "@/utils/routes";
import { UserTable } from "@/components/user/user-table";
import { CreateUserAction } from "@/components/user/create-user-action";
import { requireSuperadmin } from "@/components/user/require-superadmin";

export const metadata = {
  title: "fittkereso Admin Users",
  description: "fittkereso admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Users" },
];

export default async function UserList() {
  if (!(await requireSuperadmin())) {
    // 404 rather than a redirect, so the page does not confirm it exists to
    // someone who may not use it. The middleware usually catches this first.
    notFound();
  }

  return (
    <ListPage
      title="Users"
      breadcrumbs={breadcrumbs}
      actions={<CreateUserAction />}
    >
      <UserTable />
    </ListPage>
  );
}
