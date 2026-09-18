import { Box, Paper, Stack } from "@mantine/core";
import { Logo } from "@/components/logo";
import classes from "./auth.module.scss";

/**
 * One centred column over the abstract backdrop in auth.module.scss - the wordmark, then a
 * card holding whichever auth screen is mounted.
 *
 * The card is Mantine's Paper, so it picks up the theme's flat house style (1px border, no
 * shadow) and, importantly, an opaque --mantine-color-body fill: the washes behind it stop at
 * its edge rather than tinting the inputs.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box className={classes.page} p="md">
      <Stack className={classes.panel} align="center" gap="lg">
        <Logo size={32} />

        <Paper w="100%" p="xl">
          {children}
        </Paper>
      </Stack>
    </Box>
  );
}
