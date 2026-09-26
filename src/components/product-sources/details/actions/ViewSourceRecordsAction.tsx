"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import { PiListMagnifyingGlass } from "react-icons/pi";
import { routes } from "@/utils/routes";

/** The source's listings, on the Source Records page with only this source selected. */
export function ViewSourceRecordsAction({
  productSourceId,
}: {
  productSourceId: string;
}) {
  return (
    <Button
      component={Link}
      href={routes.productSourceRecords.listForSource(productSourceId)}
      variant="default"
      leftSection={<PiListMagnifyingGlass size={16} />}
    >
      Listings
    </Button>
  );
}
