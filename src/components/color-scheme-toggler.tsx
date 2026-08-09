"use client";

import {
  PiMoonDuotone as DarkIcon,
  PiSunDimDuotone as LightIcon,
  PiDesktop as SystemIcon,
} from "react-icons/pi";
import {
  ActionIcon,
  ActionIconProps,
  ElementProps,
  MantineColorScheme,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { match } from "@/utils/match";

type ColorSchemeTogglerProps = Omit<
  ActionIconProps,
  "children" | "c" | "onClick" | "size"
> &
  ElementProps<"button", keyof ActionIconProps>;

export function ColorSchemeToggler(props: ColorSchemeTogglerProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  // Hydration guard
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Always render SSR with system icon — stable output
  const safeColorScheme = mounted ? colorScheme : "auto";

  const { label, icon: Icon } = match(
    [safeColorScheme === "auto", { label: "System", icon: SystemIcon }],
    [safeColorScheme === "dark", { label: "Dark", icon: DarkIcon }],
    [safeColorScheme === "light", { label: "Light", icon: LightIcon }],
    [true, { label: "Dark", icon: DarkIcon }]
  );

  const handleSchemeChange = () => {
    const nextColorScheme = match<MantineColorScheme>(
      [colorScheme === "auto", "dark"],
      [colorScheme === "dark", "light"],
      [colorScheme === "light", "auto"],
      [true, "dark"]
    );

    setColorScheme(nextColorScheme);
  };

  return (
    <Tooltip label={label}>
      <ActionIcon
        variant="transparent"
        c="inherit"
        onClick={handleSchemeChange}
        {...props}
      >
        <Icon size="100%" />
      </ActionIcon>
    </Tooltip>
  );
}
