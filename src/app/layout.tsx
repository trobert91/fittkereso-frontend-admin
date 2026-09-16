import "@/app/styles/global.scss";

import "@mantine/core/styles.css";

// ‼️ import notifications styles after core package styles
import "@mantine/notifications/styles.css";
// ‼️ import carousel styles after core package styles
import "@mantine/carousel/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/dates/styles.css";

import { Geist, Geist_Mono } from "next/font/google";
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

// latin-ext is not optional here: Hungarian needs ő and ű, and without that subset they fall
// back to a different face mid-word.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      {...mantineHtmlProps}
    >
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
