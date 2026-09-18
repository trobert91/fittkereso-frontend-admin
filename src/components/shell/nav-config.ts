import { ElementType } from "react";
import {
  PiCopySimple,
  PiListBullets,
  PiPlugsConnected,
  PiRobot,
  PiStorefront,
} from "react-icons/pi";
import { TbBuildingFactory2, TbCategory } from "react-icons/tb";
import { VscTasklist } from "react-icons/vsc";
import { PiUsers } from "react-icons/pi";
import { routes } from "@/utils/routes";
import type { UserRole } from "@/models/admin-user";

export interface NavEntry {
  label: string;
  href: string;
  icon: ElementType;
  /**
   * The path prefix that counts as "you are here", where it is wider than href.
   *
   * A list lives at /products/list but a detail page at /products/<id>, and both should light
   * the same row - matching on href alone would leave every detail page with nothing
   * highlighted. The prefixes are mutually exclusive as written: "/product-sources" does not
   * start with "/products", and "/scrape-tasks" does not start with "/tasks".
   */
  match: string;
  /**
   * Hide the row unless the signed-in account reaches this level.
   *
   * Presentation only - the middleware and the API both enforce the same rule,
   * and this just avoids offering a destination that would bounce.
   */
  requiredRole?: UserRole;
}

export interface NavSection {
  title: string;
  entries: NavEntry[];
}

/**
 * The menu, flattened.
 *
 * The old sidebar nested Product Sources and Duplicates inside a collapsible Product List
 * entry. A rail cannot carry that: collapsed to 64px there is no room to show a disclosure,
 * let alone its children, so a nested item would be unreachable exactly when the menu is in
 * its usual state. Every destination is now one row.
 */
export const navSections: NavSection[] = [
  {
    title: "Products",
    entries: [
      {
        label: "Products",
        href: routes.products.list,
        icon: PiListBullets,
        match: "/products",
      },
      {
        label: "Product Sources",
        href: routes.productSources.list,
        icon: PiPlugsConnected,
        match: "/product-sources",
      },
      {
        label: "Duplicates",
        href: routes.productDuplicates.list,
        icon: PiCopySimple,
        match: "/product-duplicates",
      },
      {
        label: "Categories",
        href: routes.categories.list,
        icon: TbCategory,
        match: "/categories",
      },
      {
        label: "Brands",
        href: routes.brands.list,
        icon: TbBuildingFactory2,
        match: "/brands",
      },
      {
        label: "Sellers",
        href: routes.sellers.list,
        icon: PiStorefront,
        match: "/sellers",
      },
    ],
  },
  {
    title: "System",
    entries: [
      {
        label: "Tasks",
        href: routes.tasks.list,
        icon: VscTasklist,
        match: "/tasks",
      },
      {
        label: "Scrape Tasks",
        href: routes.scrapeTasks.list,
        icon: PiRobot,
        match: "/scrape-tasks",
      },
    ],
  },
  {
    title: "Administration",
    entries: [
      {
        label: "Users",
        href: routes.users.list,
        icon: PiUsers,
        match: "/users",
        requiredRole: "superadmin",
      },
    ],
  },
];

export function isEntryActive(pathname: string, entry: NavEntry): boolean {
  return pathname === entry.match || pathname.startsWith(`${entry.match}/`);
}
