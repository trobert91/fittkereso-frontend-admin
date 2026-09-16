"use client";

import { ElementType, useEffect, useState } from "react";
import {
  Center,
  SegmentedControl,
  useComputedColorScheme,
  useMantineColorScheme,
  type MantineColorScheme,
} from "@mantine/core";
import {
  PiDesktop,
  PiMoonDuotone,
  PiSunDimDuotone,
} from "react-icons/pi";

const CHOICES: {
  value: MantineColorScheme;
  label: string;
  Icon: ElementType;
}[] = [
  { value: "light", label: "Light", Icon: PiSunDimDuotone },
  { value: "dark", label: "Dark", Icon: PiMoonDuotone },
  { value: "auto", label: "Auto", Icon: PiDesktop },
];

/**
 * Light / Dark / Auto.
 *
 * Mantine already persists the choice and already runs the no-flash script in the root
 * layout, so this only has to render the control - there is no storage or theme-application
 * code to write, which is the whole reason the app stayed on Mantine.
 *
 * The mount guard exists because the server cannot know the stored choice: rendering the real
 * value on the first client pass would disagree with the server's markup. Until mounted every
 * switcher shows "auto", which is also the honest answer - nothing is known yet.
 */
export function ThemeSwitcher() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <SegmentedControl
      size="xs"
      fullWidth
      radius="md"
      value={mounted ? colorScheme : "auto"}
      onChange={(value) => setColorScheme(value as MantineColorScheme)}
      data={CHOICES.map(({ value, label, Icon }) => ({
        value,
        label: (
          <Center title={label} aria-label={label}>
            <Icon size="0.95rem" />
          </Center>
        ),
      }))}
    />
  );
}

/**
 * The collapsed rail's gutter icon.
 *
 * Shows the theme in force rather than the choice stored, so "auto" renders as a sun or a
 * moon instead of a third symbol that a 48px gutter has no room to explain.
 */
export function ThemeIndicatorIcon() {
  const computed = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Hold the space so the row does not jump when the icon resolves.
  if (!mounted) {
    return <span style={{ display: "block", width: "1.1rem", height: "1.1rem" }} />;
  }

  return computed === "dark" ? (
    <PiMoonDuotone size="1.1rem" />
  ) : (
    <PiSunDimDuotone size="1.1rem" />
  );
}
