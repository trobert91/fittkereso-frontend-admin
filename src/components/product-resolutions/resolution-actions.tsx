"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Group, Menu, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { isEmpty, uniqBy } from "lodash";
import { FaCheck, FaRedo, FaUndo } from "react-icons/fa";
import { IoWarning } from "react-icons/io5";
import { PiXBold } from "react-icons/pi";
import {
  postAcceptResolution,
  postReopenResolution,
  postRetryResolution,
  ResolutionAvailableAction,
  ResolutionCorrection,
  ResolutionListItem,
} from "@/api-actions/product/product-resolutions";
import { CORRECTION_LABELS, humanizeBlockedReason } from "./resolution-labels";
import { ResolutionDeclineModal } from "./resolution-decline-modal";

/**
 * Every action a row supports, rendered straight from `state.availableActions`.
 *
 * Nothing here decides what is legal — the backend derives that from the last
 * *performed* action plus live catalog state, and ships it with the row. So the
 * UI cannot offer a button the orchestrator would reject, and a decline after a
 * split automatically offers "merge into" instead of another split without this
 * component knowing the reversal table.
 */
export function ResolutionActions({
  item,
  note,
  size = "compact-xs",
  onUpdated,
  onBusyChange,
}: {
  item: ResolutionListItem;
  /** Free-text note to attach, when the surface offers one (the modal does). */
  note?: string;
  size?: "compact-xs" | "sm";
  onUpdated: (updated: ResolutionListItem) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [declineCorrection, setDeclineCorrection] =
    useState<ResolutionAvailableAction | null>(null);

  const { state, resolution } = item;

  const has = (action: string) =>
    state.availableActions.some((available) => available.action === action);

  const corrections = useMemo(
    () =>
      uniqBy(
        state.availableActions.filter(
          (available) => available.action === "decline" && available.correction,
        ),
        "correction",
      ),
    [state.availableActions],
  );

  const run = async (
    label: string,
    fn: () => Promise<ResolutionListItem>,
    successMessage: string,
  ) => {
    setBusy(true);
    onBusyChange?.(true);
    try {
      const updated = await fn();
      onUpdated(updated);
      notifications.show({
        color: "green",
        title: label,
        message: successMessage,
      });
    } catch (err) {
      notifications.show({
        color: "red",
        title: `${label} failed`,
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  // Accept means two different things depending on whether the machine's action
  // was already carried out — say which, so nobody is surprised by a merge.
  const acceptPerformsMerge = !state.lastPerformed;

  return (
    <>
      <Group gap="xs" wrap="wrap">
        {has("accept") && (
          <Tooltip
            label={
              acceptPerformsMerge
                ? "Carries out the merge the system proposed (oldest product wins)."
                : "Confirms the decision the system already carried out. Nothing changes in the catalog."
            }
            withArrow
            multiline
            maw={320}
          >
            <Button
              size={size}
              color="green"
              loading={busy}
              leftSection={<FaCheck size={10} />}
              onClick={() =>
                run(
                  "Accepted",
                  () => postAcceptResolution(resolution.id, note),
                  acceptPerformsMerge
                    ? "The proposed merge was carried out."
                    : "Recorded your confirmation.",
                )
              }
            >
              {acceptPerformsMerge ? "Accept & merge" : "Accept"}
            </Button>
          </Tooltip>
        )}

        {corrections.length > 0 && (
          <Menu shadow="sm" position="bottom-start" withinPortal width={280}>
            <Menu.Target>
              <Button
                size={size}
                color="red"
                variant="outline"
                disabled={busy}
                leftSection={<PiXBold size={10} />}
              >
                Decline
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>How should this be corrected?</Menu.Label>
              {corrections.map((correction) => (
                <Menu.Item
                  key={correction.correction}
                  onClick={() => setDeclineCorrection(correction)}
                >
                  {CORRECTION_LABELS[correction.correction as ResolutionCorrection]}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}

        {has("reopen") && (
          <Tooltip
            label="Puts this back in the queue. Catalog changes are not undone — the reopened row offers the correction that reverses them."
            withArrow
            multiline
            maw={320}
          >
            <Button
              size={size}
              variant="light"
              color="gray"
              loading={busy}
              leftSection={<FaUndo size={10} />}
              onClick={() =>
                run(
                  "Re-opened",
                  () => postReopenResolution(resolution.id, note),
                  "Back in the review queue.",
                )
              }
            >
              Re-open
            </Button>
          </Tooltip>
        )}

        {has("retry") && (
          <Tooltip
            label="Re-runs the action that failed, against freshly derived state."
            withArrow
          >
            <Button
              size={size}
              color="orange"
              loading={busy}
              leftSection={<FaRedo size={10} />}
              onClick={() =>
                run(
                  "Retried",
                  () => postRetryResolution(resolution.id),
                  "The failed action ran again.",
                )
              }
            >
              Retry
            </Button>
          </Tooltip>
        )}

        {!isEmpty(state.blockedReasons) && (
          <Tooltip
            label={state.blockedReasons.map(humanizeBlockedReason).join("\n")}
            withArrow
            multiline
            maw={380}
          >
            <Badge
              color="red"
              variant="light"
              size="sm"
              tt="none"
              leftSection={<IoWarning size={10} />}
            >
              {state.blockedReasons.length} action
              {state.blockedReasons.length === 1 ? "" : "s"} unavailable
            </Badge>
          </Tooltip>
        )}
      </Group>

      <ResolutionDeclineModal
        item={item}
        correction={declineCorrection}
        note={note}
        onClose={() => setDeclineCorrection(null)}
        onUpdated={(updated) => {
          setDeclineCorrection(null);
          onUpdated(updated);
        }}
      />
    </>
  );
}
