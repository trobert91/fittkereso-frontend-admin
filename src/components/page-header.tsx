import { ReactNode } from "react";
import {
  GroupProps,
  ElementProps,
  Title,
  Breadcrumbs,
  Text,
  Group,
  Stack,
} from "@mantine/core";
import Link from "next/link";

interface PageHeaderProps
  extends Omit<GroupProps, "title">,
    ElementProps<"header", keyof GroupProps> {
  title: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function PageHeader({
  children,
  title,
  breadcrumbs,
  actions,
  className,
  mb = "xl",
  ...props
}: PageHeaderProps) {
  return (
    <Group
      component="header"
      className={className}
      mb={mb}
      justify="space-between"
      align="flex-start"
      wrap="wrap"
      gap="md"
      {...props}
    >
      {/* Left side: Title + Breadcrumbs */}
      <Stack gap={4} style={{ flexGrow: 1, minWidth: 0 }}>
        <Title component="h2" order={2}>
          {title}
        </Title>

        {breadcrumbs && (
          <Breadcrumbs mt="xs">
            {breadcrumbs.map((breadcrumb) =>
              breadcrumb.href ? (
                <Link key={breadcrumb.label} href={breadcrumb.href}>
                  {breadcrumb.label}
                </Link>
              ) : (
                <Text key={breadcrumb.label} c="dimmed" fz="sm">
                  {breadcrumb.label}
                </Text>
              )
            )}
          </Breadcrumbs>
        )}
      </Stack>

      {/* Right side: Actions */}
      {actions && (
        <Group
          gap="xs"
          style={{
            // Actions appear right on desktop, below on mobile
            order: 0,
          }}
          styles={{
            root: {
              "@media (maxWidth: 48em)": {
                order: 1,
                width: "100%",
              },
            },
          }}
        >
          {actions}
        </Group>
      )}

      {children}
    </Group>
  );
}
