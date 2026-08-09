import { Paper, ScrollArea } from "@mantine/core";
import classes from "./dashboard.module.scss";
import { Sidebar } from "../sidebar/sidebar";
import { Logo } from "../logo";
import { Header } from "../header/header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={classes.root}>
      <Paper className={classes.sidebarWrapper} withBorder>
        <div className={classes.logoWrapper}>
          <Logo w="3rem" />
        </div>
        <ScrollArea flex="1" px="md">
          <Sidebar />
        </ScrollArea>
      </Paper>
      <div className={classes.content}>
        <Header />

        <main className={classes.main}>{children}</main>
      </div>
    </div>
  );
}
