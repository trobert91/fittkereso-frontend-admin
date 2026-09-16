"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isEntryActive, navSections } from "./nav-config";
import classes from "./shell.module.scss";

/**
 * The menu rows.
 *
 * Every row is a fixed 224px wide regardless of how wide the rail currently is - the rail
 * clips it. That is what makes the hover expansion free of reflow: nothing inside the rail
 * relayouts, the window onto it just gets wider.
 */
export function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navSections.map((section) => (
        <nav key={section.title} className={classes.section}>
          <div className={`${classes.sectionTitle} ${classes.reveal}`}>
            {section.title}
          </div>

          {section.entries.map((entry) => {
            const Icon = entry.icon;
            const active = isEntryActive(pathname, entry);

            return (
              <Link
                key={entry.href}
                href={entry.href}
                title={entry.label}
                onClick={onNavigate}
                data-active={active || undefined}
                className={`${classes.row} ${classes.navLink}`}
              >
                <span className={classes.gutter}>
                  <Icon size="1.15rem" />
                </span>
                <span className={classes.reveal}>{entry.label}</span>
              </Link>
            );
          })}
        </nav>
      ))}
    </>
  );
}
