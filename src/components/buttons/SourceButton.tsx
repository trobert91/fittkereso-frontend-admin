import { ActionIcon, Button } from "@mantine/core";
import { FaReddit, FaYoutube } from "react-icons/fa";
import { ThreadSource } from "@/models/enums/thread-enums";
import Link from "next/link";
import { useMemo } from "react";

interface SourceButtonProps {
  source: ThreadSource;
  url: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  iconSize?: number;
  showLabel?: boolean;
  label?: string;
}

export const SourceButton = ({
  source,
  url,
  size = "sm",
  iconSize = 16,
  showLabel = true,
  label,
}: SourceButtonProps) => {
  const config = useMemo(() => {
    switch (source) {
      case ThreadSource.Reddit:
        return {
          color: "orange",
          icon: <FaReddit size={iconSize} />,
          label: "Reddit",
        };
      case ThreadSource.Youtube:
        return {
          color: "red",
          icon: <FaYoutube size={iconSize} />,
          label: "YouTube",
        };
      default:
        return {
          color: "gray",
          icon: null,
          label: "Unknown",
        };
    }
  }, [source, iconSize]);

  return (
    <Link href={url} target="_blank" rel="noopener noreferrer">
      {showLabel ? (
        <Button
          color={config.color}
          size={size}
          leftSection={config.icon}
          variant="light"
        >
          {label ?? config.label}
        </Button>
      ) : (
        <ActionIcon
          color={config.color}
          size={iconSize}
          variant="transparent"
          aria-label="Go to details"
        >
          {config.icon}
        </ActionIcon>
      )}
    </Link>
  );
};
