import { Suspense } from "react";
import { ListPage } from "@/components/list/list-page";
import { ProductSourceRecordTable } from "@/components/product-source-records/product-source-record-table";
import { routes } from "@/utils/routes";

export const metadata = {
  title: "fittkereso Admin Source Records",
  description: "fittkereso admin page",
};

const breadcrumbs = [
  { label: "Home", href: routes.dashboard.root },
  { label: "Source Records" },
];

export default function ProductSourceRecordListPage() {
  return (
    <ListPage title="Source Records" breadcrumbs={breadcrumbs}>
      {/* The table reads its filters from the URL. */}
      <Suspense>
        <ProductSourceRecordTable />
      </Suspense>
    </ListPage>
  );
}
