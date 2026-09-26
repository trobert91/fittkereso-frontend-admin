import { ProductSourceConfig, ProductSourceFetchMode } from "../product-source";

export interface ProductSourceUpdateDto {
  name?: string;
  sellerId?: string;
  config?: ProductSourceConfig;
  schedulingEnabled?: boolean;
  processingEnabled?: boolean;
  priority?: number;
  identifiesProducts?: boolean;
  hasAllProducts?: boolean;
  fetchMode?: ProductSourceFetchMode;
  maxConcurrent?: number;
  requestsPerHour?: number;
  frequency?: string | null;
  // Can be changed but not cleared: omit it to leave it alone.
  detailRefreshInterval?: string;
  // ISO strings; null clears the schedule, which makes that sync due on the
  // collector's next tick.
  nextRunAt?: string | null;
}
