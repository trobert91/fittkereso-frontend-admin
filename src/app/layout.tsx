import "@/app/styles/global.scss";

import "@mantine/core/styles.css";

// ‼️ import notifications styles after core package styles
import "@mantine/notifications/styles.css";
import "@mantine/core/styles.css";
// ‼️ import carousel styles after core package styles
import "@mantine/carousel/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/dates/styles.css";

import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { NavigationProgress } from "@mantine/nprogress";
import { theme } from "@/theme";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "fittkereso Admin",
  description: "fittkereso admin page",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>

      <body>
        <MantineProvider theme={theme}>
          <Providers>
            <Notifications position="bottom-right" />
            <NavigationProgress />
            <ModalsProvider>{children}</ModalsProvider>
          </Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
