"use client";

import { NavLink, Stack, Title } from "@mantine/core";
import classes from "./sidebar.module.scss";
import { menu } from "./menu-sections";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <Stack gap="xl">
      {menu.map((item) => (
        <div key={item.header}>
          <Title order={6} className={classes.sectionTitle}>
            {item.header}
          </Title>

          {item.section.map((subItem) =>
            subItem.dropdownItems ? (
              <NavLink
                variant="subtle"
                key={subItem.name}
                label={subItem.name}
                childrenOffset={0}
                className={classes.sectionLink}
                active={
                  pathname.includes(subItem.href) ||
                  subItem.dropdownItems.some((dropdownItem) =>
                    pathname.includes(dropdownItem.href),
                  )
                }
                leftSection={subItem.icon && <subItem.icon />}
              >
                {subItem.dropdownItems?.map((dropdownItem) => (
                  <NavLink
                    variant="subtle"
                    component={Link}
                    href={dropdownItem.href}
                    key={dropdownItem.name}
                    label={dropdownItem.name}
                    active={pathname.includes(dropdownItem.href)}
                    className={classes.sectionDropdownItemLink}
                    leftSection={<span className="dot" />}
                  />
                ))}
              </NavLink>
            ) : (
              <NavLink
                variant="subtle"
                component={Link}
                href={subItem.href}
                key={subItem.name}
                label={subItem.name}
                className={classes.sectionLink}
                active={pathname.includes(subItem.href)}
                leftSection={subItem.icon && <subItem.icon />}
              />
            ),
          )}
        </div>
      ))}
    </Stack>
  );
}
