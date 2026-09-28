import { Group, Text, Tooltip } from "@mantine/core";
import { IoInformationCircleOutline } from "react-icons/io5";
import { ProductSourceRecord } from "@/models/product-source";

/** A listing's missing field: one of its names, or its match key. */
export type NotSetField = "name" | "matchKey";

/** Why this listing has no value for `field`, from how it was imported. */
export function notSetReason(
  listing: ProductSourceRecord,
  field: NotSetField,
): string {
  const contributing = listing.source?.identifiesProducts === false;
  const flags = listing.scrapedProduct?.flags ?? [];

  if (field === "matchKey") {
    return contributing
      ? "This source does not identify products, so nothing is matched on this listing."
      : "No match key is stored for this listing.";
  }
  if (flags.includes("identity_failed")) {
    return "The identity extraction ran but returned no name. The next import retries it. Matching used the original title.";
  }
  if (flags.includes("identity_off")) {
    return contributing
      ? "This source does not identify products and its identity extraction is off, so the listing keeps only its original title."
      : "Identity extraction is off for this source, so the listing keeps only its original title. Matching used the original title.";
  }
  return "No identity extraction result is stored for this listing.";
}

/** A value the listing does not have, with why on hover. */
export function NotSet({ reason }: { reason: string }) {
  return (
    <Tooltip label={reason} multiline w={320} withArrow>
      <Group
        gap={4}
        wrap="nowrap"
        display="inline-flex"
        style={{ cursor: "help" }}
      >
        <Text size="sm" c="dimmed" fs="italic">
          (not set)
        </Text>
        <IoInformationCircleOutline
          size={14}
          color="var(--mantine-color-dimmed)"
          aria-label={reason}
        />
      </Group>
    </Tooltip>
  );
}
