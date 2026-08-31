"use client";

import { useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Portal,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { isArray } from "lodash";
import {
  getResolutionById,
  postApproveResolution,
  postRejectResolution,
  ProductResolutionCandidateRecord,
  ProductResolutionRecord,
} from "@/api-actions/product/product-resolutions";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";
import { GateBadges } from "./gate-badges";

interface ResolutionDetailModalProps {
  resolutionId: string | null;
  onClose: () => void;
  onComplete: () => void;
}

function formatSpecValue(
  value: string | number | boolean | string[] | undefined,
): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (isArray(value)) return value.join(", ");
  return String(value);
}

function CandidateCard({
  candidate,
  isTop,
}: {
  candidate: ProductResolutionCandidateRecord;
  isTop: boolean;
}) {
  return (
    <Card withBorder p="sm" radius="md">
      <Stack gap={6}>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            {isTop && (
              <Badge color="blue" variant="filled" size="sm">
                Top candidate
              </Badge>
            )}
            <Text size="sm" fw={600}>
              {candidate.displayName ?? candidate.model ?? candidate.candidateId}
            </Text>
            <Anchor
              component={Link}
              href={routes.products.details(candidate.candidateId)}
            >
              <LuExternalLink size={12} />
            </Anchor>
          </Group>
          <Badge variant="outline" size="sm">
            {candidate.source.replace(/_/g, " ")}
          </Badge>
        </Group>

        <Group gap="md">
          <Text size="xs" c="dimmed">
            Brand: {candidate.brand ?? "—"}
          </Text>
          {candidate.matchScore !== undefined && (
            <Badge color="grape" variant="light" size="sm">
              score {candidate.matchScore}
            </Badge>
          )}
          <GateBadges
            passed={candidate.gates.passed}
            failedGates={candidate.gates.failedGates}
          />
        </Group>

        {candidate.specMatchDetails &&
          candidate.specMatchDetails.details.length > 0 && (
            <Stack gap={2} mt={4}>
              {candidate.specMatchDetails.details.map((spec) => {
                const bgColor =
                  spec.match === "match"
                    ? "var(--mantine-color-green-light)"
                    : spec.match === "compatible"
                      ? "var(--mantine-color-yellow-light)"
                      : "var(--mantine-color-red-light)";
                return (
                  <Group
                    key={spec.key}
                    gap={4}
                    wrap="nowrap"
                    style={{
                      backgroundColor: bgColor,
                      borderRadius: 4,
                      padding: "2px 6px",
                    }}
                  >
                    <Text size="xs" c="dimmed" style={{ minWidth: 100 }}>
                      {spec.key}
                    </Text>
                    <Text size="xs">
                      {formatSpecValue(spec.valueA)} vs{" "}
                      {formatSpecValue(spec.valueB)}
                    </Text>
                  </Group>
                );
              })}
            </Stack>
          )}
      </Stack>
    </Card>
  );
}

/** Read-only detail view for `product_resolution` rows — input, every
 *  candidate considered with its gates/spec-match, and the final decision.
 *  Confirm/reject at the bottom are confirmation-only (no catalog mutation) —
 *  unlike `DuplicatePairConfirmModal`'s approve, which triggers a merge. */
export function ResolutionDetailModal({
  resolutionId,
  onClose,
  onComplete,
}: ResolutionDetailModalProps) {
  const [resolution, setResolution] = useState<ProductResolutionRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!resolutionId) {
      setResolution(null);
      setNote("");
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const record = await getResolutionById(resolutionId);
        setResolution(record);
      } catch (err) {
        console.error("Failed to fetch resolution details:", err);
        notifications.show({
          color: "red",
          title: "Failed to load details",
          message: err instanceof Error ? err.message : "An error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [resolutionId]);

  const handleAction = async (type: "approve" | "reject") => {
    if (!resolution) return;
    setActionLoading(true);
    try {
      if (type === "approve") {
        await postApproveResolution(resolution.id);
        notifications.show({
          color: "green",
          title: "Resolution confirmed",
          message: "No catalog changes were made — this just records your review.",
        });
      } else {
        await postRejectResolution(resolution.id, note || undefined);
        notifications.show({
          color: "blue",
          title: "Resolution flagged as wrong",
          message: "No catalog changes were made — this just records your review.",
        });
      }
      onClose();
      onComplete();
    } catch (err) {
      notifications.show({
        color: "red",
        title: `${type === "approve" ? "Confirm" : "Reject"} failed`,
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const input =
    resolution?.inputSnapshot?.kind === "product_resolution"
      ? resolution.inputSnapshot.input
      : undefined;
  const decisionSnapshot = resolution?.decisionSnapshot;
  const candidates = resolution?.candidates ?? [];
  const canApprove = resolution?.decision === "pending_review";
  const canReject =
    resolution?.decision === "pending_review" ||
    resolution?.decision === "auto_accepted";

  return (
    <Portal reuseTargetNode={false}>
      <Modal
        opened={!!resolutionId}
        onClose={() => !actionLoading && onClose()}
        title="Product resolution details"
        centered
        size="xl"
      >
        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && resolution && (
          <Stack gap="md">
            <Card withBorder p="sm" radius="md">
              <Text size="xs" fw={600} c="dimmed" mb={4}>
                Input
              </Text>
              <Group gap="md">
                <Text size="sm">
                  {input?.brand} {input?.model ?? input?.displayName}
                </Text>
                {input?.referenceProductId && (
                  <Badge variant="outline" size="sm">
                    reference-anchored
                  </Badge>
                )}
              </Group>
              {resolution.resolvedProduct && (
                <Group gap="xs" mt={6}>
                  <Text size="xs" c="dimmed">
                    Resolved to:
                  </Text>
                  <Anchor
                    component={Link}
                    href={routes.products.details(resolution.resolvedProduct.id)}
                    size="sm"
                  >
                    {resolution.resolvedProduct.displayName}
                  </Anchor>
                </Group>
              )}
            </Card>

            <Divider label="Candidates considered" labelPosition="left" />
            {candidates.length === 0 && (
              <Text size="sm" c="dimmed">
                No candidates were recalled for this resolution.
              </Text>
            )}
            <Stack gap="sm">
              {candidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.candidateId}
                  candidate={candidate}
                  isTop={index === 0}
                />
              ))}
            </Stack>

            {decisionSnapshot && (
              <>
                <Divider label="Decision" labelPosition="left" />
                <Stack gap={4}>
                  <Group gap="xs">
                    <Badge variant="light" size="sm">
                      {decisionSnapshot.kind.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      confidence {decisionSnapshot.confidence}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {decisionSnapshot.reason}
                  </Text>
                  {decisionSnapshot.evidenceSummary && (
                    <Text size="xs" c="dimmed">
                      {decisionSnapshot.evidenceSummary}
                    </Text>
                  )}
                </Stack>
              </>
            )}

            {resolution.reviewNote && (
              <Text size="xs" c="dimmed">
                Review note: {resolution.reviewNote}
              </Text>
            )}

            {(canApprove || canReject) && (
              <>
                <Divider />
                <Text size="sm" c="dimmed">
                  Confirming or rejecting only records your judgment on this
                  decision, for tuning thresholds later — it does not change
                  the product catalog.
                </Text>
                <Textarea
                  label="Note (optional)"
                  placeholder="Why is this decision right or wrong?"
                  value={note}
                  onChange={(e) => setNote(e.currentTarget.value)}
                  autosize
                  minRows={2}
                />
                <Group justify="flex-end">
                  <Button
                    variant="default"
                    onClick={onClose}
                    disabled={actionLoading}
                  >
                    Close
                  </Button>
                  {canReject && (
                    <Button
                      color="red"
                      variant="light"
                      loading={actionLoading}
                      onClick={() => handleAction("reject")}
                    >
                      Flag as wrong
                    </Button>
                  )}
                  {canApprove && (
                    <Button
                      color="green"
                      loading={actionLoading}
                      onClick={() => handleAction("approve")}
                    >
                      Confirm match
                    </Button>
                  )}
                </Group>
              </>
            )}
          </Stack>
        )}
      </Modal>
    </Portal>
  );
}
