import { ReactNode } from "react";
import {
  ElementProps,
  Grid,
  Group,
  Text,
  UnstyledButton,
  UnstyledButtonProps,
} from "@mantine/core";
import classes from "./notification.module.scss";
import { CustomDate, formatRelativeDate } from "@/utils/date";

interface NotificationBaseProps
  extends ElementProps<"button", keyof UnstyledButtonProps>,
    UnstyledButtonProps {
  title: string;
  receivedAt: CustomDate | Date;
  scope?: string;
  icon?: ReactNode;
}

export function Notification({
  title,
  receivedAt,
  children,
  scope,
  icon: Icon,
  ...props
}: NotificationBaseProps) {
  return (
    <UnstyledButton className={classes.root} {...props}>
      <Grid>
        <Grid.Col span={2}>{Icon}</Grid.Col>

        <Grid.Col span={10}>
          <Text>{title}</Text>
          <Group gap="xs" c="dimmed" fz="sm">
            <Text c="inherit" fz="inherit">
              {formatRelativeDate(receivedAt)}
            </Text>
            {scope && (
              <>
                <Text c="inherit" fz="inherit">
                  &#x2022;
                </Text>
                <Text c="inherit" fz="inherit">
                  {scope}
                </Text>
              </>
            )}
          </Group>

          {children}
        </Grid.Col>
      </Grid>
    </UnstyledButton>
  );
}
