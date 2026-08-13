import { DashboardLayout } from "@/components/dashboard/dashboard";

export const metadata = {
  title: "fittkereso Admin",
  description: "fittkereso admin page",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
