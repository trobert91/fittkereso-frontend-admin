import { getCategoryById } from "@/api-actions/category/get-category";
import { CategoryDetailsHydrator } from "@/components/category/details/CategoryDetailsHydrator";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategoryById(id);

  const breadcrumbs = [
    { label: "Főoldal", href: routes.dashboard.root },
    { label: "Categories", href: routes.categories.list },
    { label: category?.name ?? "Category details" },
  ];

  return (
    <CommonPage>
      <PageHeader
        title={category?.name ?? "Category details"}
        breadcrumbs={breadcrumbs}
      />

      <CategoryDetailsHydrator category={category} />
    </CommonPage>
  );
}
