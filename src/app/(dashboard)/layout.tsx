import { DashboardLayout } from "@/components/dashboard/dashboard";

export const metadata = {
  title: "ebike Admin",
  description: "ebike admin page",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
