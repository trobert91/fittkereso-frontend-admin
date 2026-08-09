import { getProductById } from "@/api-actions/product/get-product";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { ProductActions } from "@/components/product/details/actions/ProductActions";
import { RefreshProductAction } from "@/components/product/details/actions/RefreshProductAction";
import { ProductDetailsHydrator } from "@/components/product/details/ProductDetailsHydrator";
import { routes } from "@/utils/routes";
import { notFound } from "next/navigation";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const breadcrumbs = [
    { label: "Főoldal", href: routes.dashboard.root },
    { label: "Termékek", href: routes.products.list },
    ...(product?.productCategory?.name
      ? [{
          label: product.productCategory.name,
          href: routes.products.listFiltered({ categoryId: product.productCategory.id }),
        }]
      : []),
    ...(product?.brand?.name
      ? [{
          label: product.brand.name,
          href: routes.products.listFiltered({
            categoryId: product.productCategory?.id,
            brandId: product.brand.id,
          }),
        }]
      : []),
    { label: product?.displayName ?? product?.model },
  ];

  return (
    <CommonPage>
      <PageHeader
        title={product?.displayName ?? product?.model}
        breadcrumbs={breadcrumbs}
        actions={<><RefreshProductAction /><ProductActions /></>}
      />

      <ProductDetailsHydrator product={product} />
    </CommonPage>
  );
}
