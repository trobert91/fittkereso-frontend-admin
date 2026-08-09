import { Flex, Text, Tooltip } from "@mantine/core";

interface AdminSentimentBarProps {
  strongPositive: number;
  positive: number;
  neutral: number;
  mixed: number;
  negative: number;
  strongNegative: number;
  variant: "full" | "mini";
}

const SEGMENTS: {
  key: keyof Omit<AdminSentimentBarProps, "variant">;
  label: string;
  color: string;
}[] = [
  {
    key: "strongPositive",
    label: "Very positive",
    color: "var(--mantine-color-green-8)",
  },
  {
    key: "positive",
    label: "Positive",
    color: "var(--mantine-color-green-5)",
  },
  { key: "neutral", label: "Neutral", color: "var(--mantine-color-gray-5)" },
  { key: "mixed", label: "Mixed", color: "var(--mantine-color-blue-5)" },
  {
    key: "negative",
    label: "Negative",
    color: "var(--mantine-color-orange-5)",
  },
  {
    key: "strongNegative",
    label: "Very negative",
    color: "var(--mantine-color-red-7)",
  },
];

export function AdminSentimentBar(props: AdminSentimentBarProps) {
  const { variant } = props;
  const total =
    props.strongPositive +
    props.positive +
    props.neutral +
    props.mixed +
    props.negative +
    props.strongNegative;
  if (total === 0) return null;

  return (
    <Flex
      gap={1}
      style={{
        width: "100%",
        height: variant === "full" ? 20 : 8,
        borderRadius: "var(--mantine-radius-xl)",
        overflow: "hidden",
      }}
    >
      {SEGMENTS.map(({ key, label, color }) => {
        const value = props[key] as number;
        const pct = (value / total) * 100;
        if (pct === 0) return null;

        return (
          <Tooltip key={key} label={`${label}: ${Math.round(pct)}%`}>
            <div
              style={{
                width: `${pct}%`,
                backgroundColor: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 4,
                height: "100%",
                transition: "width 200ms ease",
              }}
            >
              {variant === "full" && pct >= 10 && (
                <Text
                  size="sm"
                  c="white"
                  fw={600}
                  style={{ lineHeight: 1, whiteSpace: "nowrap" }}
                >
                  {Math.round(pct)}%
                </Text>
              )}
            </div>
          </Tooltip>
        );
      })}
    </Flex>
  );
}
