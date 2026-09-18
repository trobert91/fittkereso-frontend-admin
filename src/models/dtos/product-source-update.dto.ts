import { ProductSourceConfig } from "../product-source";

export interface ProductSourceUpdateDto {
  name?: string;
  sellerId?: string;
  config?: ProductSourceConfig;
  schedulingEnabled?: boolean;
  processingEnabled?: boolean;
  priority?: number;
  maxConcurrent?: number;
  requestsPerHour?: number;
  fullSyncInterval?: string | null;
  // ISO strings; null clears the schedule, which makes that sync due on the
  // collector's next tick.
  nextFullSyncAt?: string | null;
}
