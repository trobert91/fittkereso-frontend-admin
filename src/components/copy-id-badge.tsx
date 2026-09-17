"use client";

import { Badge, CopyButton, Tooltip } from "@mantine/core";

/**
 * A click-to-copy id. The reason to surface an id at all is to take it
 * somewhere else — the product-id filter, a log query, a ticket — so it is a
 * button rather than text, and monospaced so a uuid can be eyeballed against
 * the one you are comparing it to.
 */
export function CopyIdBadge({
  id,
  label = "Copy ID",
}: {
  id: string;
  label?: string;
}) {
  return (
    <CopyButton value={id}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? "Copied" : label} withArrow>
          <Badge
            variant="outline"
            size="sm"
            color={copied ? "green" : "gray"}
            tt="none"
            ff="monospace"
            style={{ cursor: "pointer" }}
            onClick={copy}
          >
            {id}
          </Badge>
        </Tooltip>
      )}
    </CopyButton>
  );
}
