"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Burger, Drawer, Tooltip, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { TbPinned, TbPinnedOff } from "react-icons/tb";
import { Logo, LogoMark } from "@/components/logo";
import { routes } from "@/utils/routes";
import { Nav } from "./nav";
import { RailUser } from "./rail-user";
import { ThemeIndicatorIcon, ThemeSwitcher } from "./theme-switcher";
import { useRailFloating } from "./use-rail-settings";
import classes from "./shell.module.scss";

/**
 * The menu's own settings, shown at its foot above the signed-in user.
 *
 * Collapsed, only the 48px gutter is visible, which cannot hold a three-way control - so the
 * gutter carries the current theme's icon and the switcher itself appears on expand. The same
 * reason the pin row shows only its icon until there is room for a label.
 */
function RailSettings({
  floating,
  onToggleFloating,
}: {
  floating: boolean;
  onToggleFloating: () => void;
}) {
  return (
    <>
      <div className={classes.settingRow}>
        <span className={classes.gutter}>
          <ThemeIndicatorIcon />
        </span>
        <span className={`${classes.settingControl} ${classes.reveal}`}>
          <ThemeSwitcher />
        </span>
      </div>

      <Tooltip label={floating ? "Pin menu open" : "Let menu float"} position="right">
        <UnstyledButton
          onClick={onToggleFloating}
          aria-pressed={!floating}
          className={`${classes.row} ${classes.navLink}`}
        >
          <span className={classes.gutter}>
            {floating ? <TbPinned size="1.15rem" /> : <TbPinnedOff size="1.15rem" />}
          </span>
          <span className={classes.reveal}>
            {floating ? "Pin menu open" : "Let menu float"}
          </span>
        </UnstyledButton>
      </Tooltip>
    </>
  );
}

/** Logo, menu, settings, user - the same body on the desktop rail and in the mobile drawer. */
function RailBody({
  floating,
  onToggleFloating,
  onNavigate,
}: {
  floating: boolean;
  onToggleFloating: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link
        href={routes.products.list}
        title="Fittkereso"
        onClick={onNavigate}
        className={`${classes.row} ${classes.navLink}`}
      >
        <span className={classes.gutter}>
          <LogoMark size={22} />
        </span>
        <span className={classes.reveal}>
          <Logo mark={false} size={22} />
        </span>
      </Link>

      <Nav onNavigate={onNavigate} />

      <div className={classes.footer}>
        <RailSettings floating={floating} onToggleFloating={onToggleFloating} />
        <RailUser />
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { floating, setFloating, ready } = useRailFloating();
  const [drawerOpen, { open, close }] = useDisclosure(false);
  const pathname = usePathname();

  useEffect(() => {
    close();
  }, [pathname, close]);

  const toggleFloating = () => setFloating((value) => !value);

  return (
    <div className={classes.shell}>
      <aside
        className={classes.rail}
        data-floating={floating}
        data-ready={ready}
        aria-label="Main menu"
      >
        <RailBody floating={floating} onToggleFloating={toggleFloating} />
      </aside>

      <Drawer
        opened={drawerOpen}
        onClose={close}
        size="16rem"
        padding="sm"
        withCloseButton={false}
        aria-label="Main menu"
      >
        <div className={classes.drawerRail}>
          {/* Pinned inside the drawer: there is no collapsed state to float away from. */}
          <RailBody
            floating={false}
            onToggleFloating={toggleFloating}
            onNavigate={close}
          />
        </div>
      </Drawer>

      <div className={classes.content} data-floating={floating}>
        <div className={classes.mobileBar}>
          <Burger opened={drawerOpen} onClick={open} size="sm" aria-label="Open menu" />
          <Link href={routes.products.list} style={{ display: "flex" }}>
            <Logo size={22} />
          </Link>
        </div>

        <main className={classes.main}>{children}</main>
      </div>
    </div>
  );
}
