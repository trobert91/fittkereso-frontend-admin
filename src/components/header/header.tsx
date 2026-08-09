import { Group } from "@mantine/core";
import { Logo } from "@/components/logo";
import { CurrentUser } from "./current-user";
import { Notifications } from "./notifications";
import { SearchMenu } from "./search-menu";
import { SidebarButton } from "./sidebar-button";
import classes from "./header.module.scss";
import { StickyHeader } from "./sticky-header/sticky-header";
import { SpotlightSearchBarButton } from "./spotlight-search-bar-button";
import { ColorSchemeToggler } from "../color-scheme-toggler";
import Link from "next/link";

export function Header() {
  return (
    <StickyHeader className={classes.root}>
      <div className={classes.rightContent}>
        <SidebarButton />
        <Link href="/" className={classes.logo}>
          <Logo />
        </Link>
        <SpotlightSearchBarButton
          placeholder="Search for feature"
          spotlight={<SearchMenu />}
        />
      </div>

      <Group>
        <ColorSchemeToggler />
        ()
        <Notifications />
        <CurrentUser />
      </Group>
    </StickyHeader>
  );
}
