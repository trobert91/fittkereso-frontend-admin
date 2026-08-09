"use client";

import { useState } from "react";
import { Box, Group, Modal, Table, Text, Title, Tooltip } from "@mantine/core";
import { IoInformationCircleOutline } from "react-icons/io5";

interface ScoreRingProps {
  rate: number;
  size?: number;
  thickness?: number;
  reviewCount?: number;
  tooltip?: string;
  showLabel?: boolean;
  withModal?: boolean;
}

const RATING_LEVELS = [
  {
    range: "≥ 80",
    label: "Excellent",
    color: "var(--mantine-color-green-6)",
    bg: "rgba(64, 192, 87, 0.12)",
  },
  {
    range: "≥ 60",
    label: "Good",
    color: "var(--mantine-color-yellow-6)",
    bg: "rgba(252, 196, 25, 0.12)",
  },
  {
    range: "≥ 40",
    label: "Mixed",
    color: "var(--mantine-color-orange-6)",
    bg: "rgba(255, 146, 43, 0.12)",
  },
  {
    range: "< 40",
    label: "Poor",
    color: "var(--mantine-color-red-6)",
    bg: "rgba(250, 82, 82, 0.12)",
  },
];

function getColor(rate: number): string {
  if (rate >= 80) return "var(--mantine-color-green-6)";
  if (rate >= 60) return "var(--mantine-color-yellow-6)";
  if (rate >= 40) return "var(--mantine-color-orange-6)";
  return "var(--mantine-color-red-6)";
}

function getLabel(rate: number): string {
  if (rate >= 80) return "Excellent";
  if (rate >= 60) return "Good";
  if (rate >= 40) return "Mixed";
  return "Poor";
}

export function ScoreRing({
  rate,
  size = 40,
  thickness = 4,
  reviewCount,
  tooltip,
  showLabel = false,
  withModal = false,
}: ScoreRingProps) {
  const [opened, setOpened] = useState(false);
  const px = size;
  const stroke = thickness;
  const font = Math.max(8, Math.round(px * 0.4));
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;
  const color = getColor(rate);
  const center = px / 2;

  const ring = (
    <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--mantine-color-dark-5)"
        strokeWidth={stroke}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontSize={font}
        fontWeight={700}
      >
        {Math.round(rate)}
      </text>
    </svg>
  );

  const ringWithTooltip = tooltip ? (
    <Tooltip label={tooltip} withArrow>
      <Box style={{ display: "inline-flex" }}>{ring}</Box>
    </Tooltip>
  ) : (
    ring
  );

  return (
    <>
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        {ringWithTooltip}
        {showLabel && (
          <>
            <Text size="sm" fw={600} ta="center" style={{ color }}>
              {getLabel(rate)}
            </Text>
            {withModal && (
              <Group
                gap={4}
                style={{ cursor: "pointer" }}
                onClick={() => setOpened(true)}
              >
                <Text size="sm" c="dimmed" ta="center">
                  Userscore · {Math.round(rate)}/100
                </Text>
                <IoInformationCircleOutline
                  size={14}
                  color="var(--mantine-color-dimmed)"
                />
              </Group>
            )}
          </>
        )}
        {reviewCount !== undefined && (
          <Text size="sm" c="dimmed" ta="center">
            {reviewCount} reviews
          </Text>
        )}
      </div>

      {withModal && (
        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title="How the Userscore works"
          size="xl"
          centered
        >
          <Text c="dimmed" mb="lg">
            The Userscore is a 0–100 rating derived from AI analysis of real
            user reviews on Reddit. It reflects the overall sentiment and
            recommendation rate across all collected discussions.
          </Text>

          <Title order={4} mb="xs">
            Score levels
          </Title>
          <Table mb="lg" withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Score</Table.Th>
                <Table.Th>Label</Table.Th>
                <Table.Th>Meaning</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {RATING_LEVELS.map((level) => (
                <Table.Tr key={level.label} style={{ background: level.bg }}>
                  <Table.Td fw={600} style={{ color: level.color }}>
                    {level.range}
                  </Table.Td>
                  <Table.Td fw={600} style={{ color: level.color }}>
                    {level.label}
                  </Table.Td>
                  <Table.Td>
                    {level.label === "Excellent" &&
                      "Highly recommended by the community"}
                    {level.label === "Good" &&
                      "Generally well-received with minor concerns"}
                    {level.label === "Mixed" &&
                      "Divided opinions — notable pros and cons"}
                    {level.label === "Poor" &&
                      "Significant issues reported by users"}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Title order={4} mb="xs">
            How it&apos;s calculated
          </Title>
          <Text c="dimmed" mb="xs">
            Our AI reads Reddit discussions, identifies sentiment per review,
            and aggregates it into a weighted score. Only{" "}
            <strong>hands-on reviews</strong> (owners, prior owners, and
            testers) influence the score. Speculative comments from prospective
            buyers are displayed separately but do not affect ratings.
          </Text>
          <Text c="dimmed" component="ul" mb="md" style={{ paddingLeft: 20 }}>
            <li>Overall sentiment (positive / negative / neutral / mixed)</li>
            <li>
              Recommendation rate — how many hands-on users explicitly recommend
              the product
            </li>
            <li>Vote weight — highly upvoted reviews carry more influence</li>
            <li>
              Experience depth — detailed owner reviews carry more weight than
              brief mentions
            </li>
          </Text>
        </Modal>
      )}
    </>
  );
}
