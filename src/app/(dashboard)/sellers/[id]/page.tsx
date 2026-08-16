import { getSellerById } from "@/api-actions/seller/get-seller";
import { SellerDetailsHydrator } from "@/components/seller/details/SellerDetailsHydrator";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { routes } from "@/utils/routes";

export default async function SellerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await getSellerById(id);

  const breadcrumbs = [
    { label: "Home", href: routes.dashboard.root },
    { label: "Sellers", href: routes.sellers.list },
    { label: seller?.name ?? "Seller details" },
  ];

  return (
    <CommonPage>
      <PageHeader
        title={seller?.name ?? "Seller details"}
        breadcrumbs={breadcrumbs}
      />

      <SellerDetailsHydrator seller={seller} />
    </CommonPage>
  );
}
