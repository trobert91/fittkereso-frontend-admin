/** One listing of a source. See the backend's ProductSourceRecordRow. */
export interface ProductSourceRecordRow {
  id: string;
  sourceId: string;
  sourceName: string;
  url: string | null;
  externalId: string | null;
  /** The externalIds its offers are stored under. */
  offerExternalIds: string[];
  title: string | null;
  price: number | null;
  /** Null while the listing waits unattached. */
  productId: string | null;
  productName: string | null;
  /** When its source last listed it. */
  seenAt: string;
}

export interface ProductSourceRecordList {
  items: ProductSourceRecordRow[];
  total: number;
}

export interface ProductSourceRecordQuery {
  /** True: on a product. False: unattached. Omitted: both. */
  attached?: boolean;
  search?: string;
  skip?: number;
  take?: number;
}
