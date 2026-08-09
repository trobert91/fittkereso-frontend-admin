import { SimpleGrid, Text } from "@mantine/core";
import { OrderedSpec } from "@/models/product-specs";

function formatValue(
  value: string | number | boolean | string[] | undefined
): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function AdminSpecTable({ specs }: { specs: OrderedSpec[] }) {
  if (!specs || specs.length === 0) return null;

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
      {specs.map((spec) => (
        <div
          key={spec.key}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: "8px 10px",
            borderRadius: 6,
            backgroundColor: "var(--mantine-color-dark-6)",
          }}
        >
          <Text size="sm" c="dimmed">
            {spec.label}
          </Text>
          <Text size="sm">{formatValue(spec.value)}</Text>
        </div>
      ))}
    </SimpleGrid>
  );
}
