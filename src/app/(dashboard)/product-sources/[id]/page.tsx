import { getProductSourceById } from "@/api-actions/product-source/get-product-source";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { Group } from "@mantine/core";
import { TriggerProductSourceFullSyncAction } from "@/components/product-sources/details/actions/TriggerProductSourceFullSyncAction";
import { ViewSourceRecordsAction } from "@/components/product-sources/details/actions/ViewSourceRecordsAction";
import { ProductSourceDetailsHydrator } from "@/components/product-sources/details/ProductSourceDetailsHydrator";
import { routes } from "@/utils/routes";

export default async function ProductSourceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productSource = await getProductSourceById(id);

  const breadcrumbs = [
    { label: "Home", href: routes.dashboard.root },
    { label: "Product Sources", href: routes.productSources.list },
    { label: productSource?.name ?? "Product source details" },
  ];

  return (
    <CommonPage>
      <PageHeader
        title={productSource?.name ?? "Product source details"}
        breadcrumbs={breadcrumbs}
        actions={
          productSource ? (
            <Group gap="xs">
              <ViewSourceRecordsAction productSourceId={productSource.id} />
              <TriggerProductSourceFullSyncAction
                productSourceId={productSource.id}
              />
            </Group>
          ) : undefined
        }
      />

      <ProductSourceDetailsHydrator productSource={productSource} />
    </CommonPage>
  );
}
