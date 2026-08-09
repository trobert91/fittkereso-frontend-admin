import { getBrandById } from "@/api-actions/brand/get-brand";
import { BrandDetailsHydrator } from "@/components/brand/details/BrandDetailsHydrator";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";

export default async function BrandDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await getBrandById(id);

  const breadcrumbs = [
    { label: "Home", href: routes.dashboard.root },
    { label: "Brands", href: routes.brands.list },
    { label: brand?.name ?? "Brand details" },
  ];

  return (
    <CommonPage>
      <PageHeader
        title={brand?.name ?? "Brand details"}
        breadcrumbs={breadcrumbs}
      />

      <BrandDetailsHydrator brand={brand} />
    </CommonPage>
  );
}
