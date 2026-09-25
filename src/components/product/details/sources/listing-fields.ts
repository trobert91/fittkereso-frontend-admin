import { isEqual, sortBy, uniq } from "lodash";
import { OfferAvailability } from "@/models/offer";
import {
  ProductSourceRecord,
  ScrapedOffer,
  ScrapedProductSpec,
} from "@/models/product-source";
import { ProductSpecs, SpecDefinitionJsonSchema } from "@/models/product-specs";

export type SpecValue = ProductSpecs[string];

export const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== "";

export function formatMoney(value: number, currency?: string | null): string {
  if (currency) {
    try {
      return new Intl.NumberFormat("hu-HU", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      // Not an ISO currency code: shown as the source gave it, below.
    }
  }
  const amount = new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: 2,
  }).format(value);
  return currency ? `${amount} ${currency}` : amount;
}

export function formatSpecValue(
  value: SpecValue | null,
  unit?: string
): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "number" && unit) return `${value} ${unit}`;
  return String(value);
}

// A spec key's label, unit and position, from the product category's schema.
// Keys the schema does not know keep their key as the label and sort last.
function specMeta(schema: SpecDefinitionJsonSchema | undefined) {
  const properties = schema?.properties ?? {};
  const position = new Map(
    Object.keys(properties).map((key, index) => [key, index])
  );
  return {
    label: (key: string) => properties[key]?.title ?? key,
    unit: (key: string) => properties[key]?.meta?.unit,
    sort: (keys: string[]) =>
      sortBy(
        keys,
        (key) => position.get(key) ?? Number.MAX_SAFE_INTEGER,
        (key) => key
      ),
  };
}

export interface ShopGroup {
  key: string;
  name: string;
  sellerId?: string;
  // Admin edits: the product's own record, with no source behind it.
  manual: boolean;
  listings: ProductSourceRecord[];
}

// One group per shop, by name, with admin edits last. Within a shop the
// listing whose values win comes first — the highest priority — which is also
// the order the offer composer reads them in.
export function groupListingsByShop(
  records: ProductSourceRecord[]
): ShopGroup[] {
  const groups = new Map<string, ShopGroup>();
  for (const record of records) {
    const seller = record.source?.seller;
    const key = !record.source
      ? "manual"
      : seller
      ? `seller:${seller.id}`
      : `source:${record.source.id}`;
    const group = groups.get(key) ?? {
      key,
      name: !record.source ? "Admin edits" : seller?.name ?? record.source.name,
      sellerId: seller?.id,
      manual: !record.source,
      listings: [],
    };
    group.listings.push(record);
    groups.set(key, group);
  }

  return sortBy(
    [...groups.values()].map((group) => ({
      ...group,
      listings: sortBy(
        group.listings,
        (record) => -(record.source?.priority ?? 0),
        (record) => record.source?.name ?? ""
      ),
    })),
    (group) => group.manual,
    (group) => group.name.toLowerCase()
  );
}

/**
 * Where a listing's final spec value came from:
 * - `mapped`: the source config's mapping read it, and it was kept as is;
 * - `ai`: the LLM post-process added it, with no mapped value;
 * - `changed`: mapped, then replaced by the LLM post-process;
 * - `dropped`: mapped, but left out of the final specs.
 */
export type SpecOrigin = "mapped" | "ai" | "changed" | "dropped";

export interface SpecRow {
  key: string;
  label: string;
  unit?: string;
  // The final value; the mapped one for a dropped row.
  value: SpecValue;
  // The mapped value a changed row replaced.
  mappedValue?: SpecValue;
  // Unknown when the record kept no mapped specs (an admin edit, or one stored
  // before they were kept).
  origin?: SpecOrigin;
}

function definedSpecs(specs?: ProductSpecs | null): ProductSpecs {
  return Object.fromEntries(
    Object.entries(specs ?? {}).filter(([, value]) => hasValue(value))
  );
}

// The keys a listing puts on its offers rather than on the product. A mapped
// value for one of them is not dropped: it moved to the offer entries.
export function offerLevelKeys(record: ProductSourceRecord): Set<string> {
  const scraped = record.scrapedProduct;
  return new Set([
    ...Object.keys(scraped?.offerLevelDeterministicSpecs ?? {}),
    ...(scraped?.offers ?? []).flatMap((offer) =>
      Object.keys(offer.specs ?? {})
    ),
  ]);
}

export function listingSpecRows(
  record: ProductSourceRecord,
  schema: SpecDefinitionJsonSchema | undefined
): SpecRow[] {
  const meta = specMeta(schema);
  const final = definedSpecs(record.scrapedProduct?.specs);
  const extractedSpecs = record.scrapedProduct?.extractedSpecs;
  const mapped = definedSpecs(extractedSpecs);
  const offerKeys = offerLevelKeys(record);

  const keys = [
    ...Object.keys(final),
    ...Object.keys(mapped).filter(
      (key) => !(key in final) && !offerKeys.has(key)
    ),
  ];

  return meta.sort(keys).map((key): SpecRow => {
    const row = { key, label: meta.label(key), unit: meta.unit(key) };
    if (!extractedSpecs) {
      return { ...row, value: final[key] };
    }
    if (!(key in final)) {
      return { ...row, value: mapped[key], origin: "dropped" };
    }
    if (!(key in mapped)) {
      return { ...row, value: final[key], origin: "ai" };
    }
    return isEqual(final[key], mapped[key])
      ? { ...row, value: final[key], origin: "mapped" }
      : {
          ...row,
          value: final[key],
          mappedValue: mapped[key],
          origin: "changed",
        };
  });
}

// What one offer entry says about one field. `empty` is a field the source
// maps and found no value for — it clears that field on the offer, where an
// `absent` one leaves it to the seller's other sources.
export type OfferCell =
  | { state: "value"; value: unknown }
  | { state: "empty" }
  | { state: "absent" };

export type OfferFieldKind =
  | "text"
  | "price"
  | "availability"
  | "url"
  | "list"
  | "spec";

export interface OfferFieldRow {
  key: string;
  label: string;
  kind: OfferFieldKind;
  unit?: string;
  cells: OfferCell[];
}

const OFFER_FIELDS: {
  key: keyof ScrapedOffer;
  label: string;
  kind: OfferFieldKind;
}[] = [
  { key: "externalId", label: "External id", kind: "text" },
  { key: "price", label: "Price", kind: "price" },
  { key: "priceWithoutDiscount", label: "Old price", kind: "price" },
  { key: "currency", label: "Currency", kind: "text" },
  { key: "availability", label: "Availability", kind: "availability" },
  { key: "gtin", label: "GTIN", kind: "text" },
  { key: "mpn", label: "MPN", kind: "text" },
  { key: "locations", label: "Locations", kind: "list" },
  { key: "url", label: "URL", kind: "url" },
];

const cellOf = (value: unknown): OfferCell =>
  value === undefined
    ? { state: "absent" }
    : value === null || (Array.isArray(value) && value.length === 0)
    ? { state: "empty" }
    : { state: "value", value };

export interface ListingOfferSummary {
  count: number;
  // The single entry's id; several entries are summed up by `count`.
  externalId?: string;
  price?: { min: number; max: number; currency?: string | null };
  // Only for a single entry: several entries' old prices don't sum up.
  oldPrice?: number;
  // "mixed" when the entries disagree.
  availability?: OfferAvailability | "mixed";
  // Each entry's offer-level specs (size, colour…), e.g. "M · 48 cm · Black".
  variants: string[];
}

/** What a closed listing row shows of the offers the source stated. */
export function listingOfferSummary(
  entries: ScrapedOffer[],
  schema: SpecDefinitionJsonSchema | undefined
): ListingOfferSummary {
  const meta = specMeta(schema);
  const prices = entries
    .map((entry) => entry.price)
    .filter((price) => typeof price === "number");
  const availabilities = uniq(
    entries.map((entry) => entry.availability).filter((value) => !!value)
  );

  return {
    count: entries.length,
    externalId: entries.length === 1 ? entries[0].externalId : undefined,
    price: prices.length
      ? {
          min: Math.min(...prices),
          max: Math.max(...prices),
          currency: entries[0].currency,
        }
      : undefined,
    oldPrice:
      entries.length === 1
        ? entries[0].priceWithoutDiscount ?? undefined
        : undefined,
    availability:
      availabilities.length > 1
        ? "mixed"
        : (availabilities[0] as OfferAvailability | undefined),
    variants: entries
      .map((entry) => {
        const specs = definedSpecs(entry.specs);
        return meta
          .sort(Object.keys(specs))
          .map((key) => formatSpecValue(specs[key], meta.unit(key)))
          .join(" · ");
      })
      .filter(Boolean),
  };
}

/**
 * A listing's offer entries as rows of fields, one column per entry. Only the
 * fields some entry carries get a row; the rest are the ones this source does
 * not read at all, returned as `unmapped`.
 */
export function offerFieldRows(
  entries: ScrapedOffer[],
  schema: SpecDefinitionJsonSchema | undefined
): { rows: OfferFieldRow[]; unmapped: string[] } {
  const meta = specMeta(schema);
  const carried = (key: keyof ScrapedOffer) =>
    entries.some((entry) => entry[key] !== undefined);

  const rows: OfferFieldRow[] = OFFER_FIELDS.filter((field) =>
    carried(field.key)
  ).map((field) => ({
    ...field,
    cells: entries.map((entry) => cellOf(entry[field.key])),
  }));

  // Only worth a row when an entry was stored under another id than it gave.
  if (
    entries.some(
      (entry) =>
        entry.resolvedExternalId !== undefined &&
        entry.resolvedExternalId !== entry.externalId
    )
  ) {
    rows.splice(1, 0, {
      key: "resolvedExternalId",
      label: "Stored as",
      kind: "text",
      cells: entries.map((entry) => cellOf(entry.resolvedExternalId)),
    });
  }

  const specKeys = meta.sort([
    ...new Set(
      entries.flatMap((entry) =>
        Object.entries(entry.specs ?? {})
          .filter(([, value]) => hasValue(value))
          .map(([key]) => key)
      )
    ),
  ]);
  for (const key of specKeys) {
    rows.push({
      key: `specs.${key}`,
      label: meta.label(key),
      kind: "spec",
      unit: meta.unit(key),
      cells: entries.map((entry) =>
        cellOf(hasValue(entry.specs?.[key]) ? entry.specs?.[key] : undefined)
      ),
    });
  }

  const unmapped = OFFER_FIELDS.filter((field) => !carried(field.key)).map(
    (field) => field.label
  );
  return { rows, unmapped };
}

export interface SourceRowSection {
  title?: string;
  rows: { key: string; name: string; value: string }[];
}

// The source's own label/value rows, in page order, split where the page's
// section heading changes.
export function sourceRowSections(
  rawSpecs: ScrapedProductSpec[] | undefined
): SourceRowSection[] {
  const sections: SourceRowSection[] = [];
  (rawSpecs ?? []).forEach((spec, index) => {
    const last = sections[sections.length - 1];
    const section =
      last && last.title === spec.sectionTitle
        ? last
        : sections[sections.push({ title: spec.sectionTitle, rows: [] }) - 1];
    section.rows.push({
      key: `${spec.name}-${index}`,
      name: spec.name,
      value: spec.values?.length
        ? spec.values.join(", ")
        : spec.description ?? "—",
    });
  });
  return sections;
}
