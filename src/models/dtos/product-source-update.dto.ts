export interface ProductSourceUpdateDto {
  name?: string;
  config?: unknown;
  schedulingEnabled?: boolean;
  processingEnabled?: boolean;
  priority?: number;
  maxConcurrent?: number;
  requestsPerHour?: number;
  fullSyncInterval?: string | null;
  incrementalSyncInterval?: string | null;
}
