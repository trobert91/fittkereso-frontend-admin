import { Badge, Group } from "@mantine/core";
import { ReferenceDetails } from "@/models/product-reference";

interface ReferenceDetailsBadgesProps {
  details: ReferenceDetails | null | undefined;
  size?: string;
}

export function ReferenceDetailsBadges({ details, size = "md" }: ReferenceDetailsBadgesProps) {
  if (!details) return null;

  const badges: { label: string; color: string }[] = [];

  if (details.returned) {
    badges.push({ label: "returned", color: "red" });
  }
  if (details.defective) {
    badges.push({ label: "defective", color: "red" });
  }
  if (details.multipleUnits) {
    badges.push({ label: "multiple units", color: "violet" });
  }

  if (badges.length === 0) return null;

  return (
    <>
      {badges.map((b) => (
        <Badge key={b.label} color={b.color} variant="outline" size={size} tt="none">
          {b.label}
        </Badge>
      ))}
    </>
  );
}
