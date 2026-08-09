import { Box, LoadingOverlay } from "@mantine/core";
import { ReactNode } from "react";

export const CommonPage = ({
  loading = false,
  children,
}: {
  loading?: boolean;
  children: ReactNode;
}) => {
  return (
    <Box pos="relative" miw="100%" mih="100%">
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      {children}
    </Box>
  );
};
