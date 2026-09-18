import { ProductSourceConfig } from "../product-source";

/** Who made a change. See the backend's ProductSourceActorType. */
export type ProductSourceActorType = "user" | "system";

/**
 * The user a history row is attributed to, when a person made it.
 *
 * Null once the account is deleted — the backend nulls the link rather than
 * blocking the deletion — which is why every row also carries `actorLabel`.
 */
export interface ProductSourceActorUser {
  id: string;
  name?: string;
  email?: string;
}

/** One revision of a source's scrape config. */
export interface ProductSourceVersion {
  id: string;
  version: number;
  config: ProductSourceConfig;
  note: string;
  /** Set when this version was made by restoring an earlier one. */
  restoredFromVersion?: number | null;
  actorType: ProductSourceActorType;
  actorUser?: ProductSourceActorUser | null;
  /** The actor's email, frozen when the row was written. */
  actorLabel?: string | null;
  createdAt: string;
}

/** What happened to a source. See the backend's ProductSourceActionType. */
export type ProductSourceActionType =
  | "created"
  | "config_version_created"
  | "config_restored"
  | "config_validation_failed"
  | "sync_triggered"
  | "scheduling_changed"
  | "processing_changed"
  | "seller_changed";

/** One entry of a source's audit timeline. */
export interface ProductSourceAction {
  id: string;
  type: ProductSourceActionType;
  payload: Record<string, unknown>;
  actorType: ProductSourceActorType;
  actorUser?: ProductSourceActorUser | null;
  actorLabel?: string | null;
  /** When the thing happened, which is not always when it was written down. */
  occurredAt: string;
}

export interface ProductSourceVersionList {
  items: ProductSourceVersion[];
  total: number;
}

export interface ProductSourceActionList {
  items: ProductSourceAction[];
  total: number;
}

/**
 * Who acted, for display.
 *
 * The live account first so a rename shows through, then the frozen label —
 * the only thing left once the account is deleted and the link goes null.
 * Never invents a name for a system row: `actorType` exists precisely because
 * a missing user means two different things.
 */
export function describeActor(row: {
  actorType: ProductSourceActorType;
  actorUser?: ProductSourceActorUser | null;
  actorLabel?: string | null;
}): string {
  if (row.actorType === "system") {
    return row.actorLabel ? `System (${row.actorLabel})` : "System";
  }

  return (
    row.actorUser?.name ||
    row.actorUser?.email ||
    row.actorLabel ||
    "A deleted account"
  );
}
