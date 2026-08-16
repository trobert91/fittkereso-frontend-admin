import { routes } from "@/utils/routes";
import { ElementType } from "react";
import { PiListBullets, PiStarDuotone, PiStorefront } from "react-icons/pi";
import { TbBuildingFactory2, TbCategory } from "react-icons/tb";
import { VscTasklist } from "react-icons/vsc";

interface MenuItem {
  header: string;
  section: {
    name: string;
    href: string;
    icon: ElementType;
    dropdownItems?: {
      name: string;
      href: string;
      badge?: string;
    }[];
  }[];
}

export const menu: MenuItem[] = [
  {
    header: "Home",
    section: [
      {
        name: "Home",
        href: routes.dashboard.root,
        icon: PiStarDuotone,
      },
    ],
  },
  {
    header: "Products",
    section: [
      {
        name: "Product List",
        href: routes.products.list,
        icon: PiListBullets,
        dropdownItems: [
          {
            name: "Products",
            href: routes.products.list,
          },
          {
            name: "Product Sources",
            href: routes.productSources.list,
          },
          {
            name: "Product Duplications",
            href: routes.productDuplications.list,
          },
        ],
      },
      {
        name: "Category List",
        href: routes.categories.list,
        icon: TbCategory,
      },
      {
        name: "Brand List",
        href: routes.brands.list,
        icon: TbBuildingFactory2,
      },
      {
        name: "Seller List",
        href: routes.sellers.list,
        icon: PiStorefront,
      },
    ],
  },
  {
    header: "System",
    section: [
      {
        name: "Task List",
        href: routes.tasks.list,
        icon: VscTasklist,
      },
      {
        name: "Scrape Task List",
        href: routes.scrapeTasks.list,
        icon: VscTasklist,
      },
    ],
  },
];
