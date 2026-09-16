import { AppShell } from "@/components/shell/app-shell";

export const metadata = {
  title: "fittkereso Admin",
  description: "fittkereso admin page",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
