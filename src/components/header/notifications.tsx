"use client";

import { PiBellDuotone as NotificationsIcon } from "react-icons/pi";
import {
  ActionIcon,
  ActionIconProps,
  Avatar,
  Button,
  Drawer,
  ElementProps,
  Indicator,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Notification } from "./notification";
import { useMemo } from "react";

type NotificationsProps = Omit<
  ActionIconProps,
  "children" | "c" | "onClick" | "size"
> &
  ElementProps<"button", keyof ActionIconProps>;

export function Notifications(props: NotificationsProps) {
  const [opened, { open, close }] = useDisclosure(false);

  // TODO: fetch notifications from API
  const notifications = useMemo(
    () => [
      {
        id: "bd99a426sbl30qzhr9j0z8xy",
        type: "network:request",
        title: "John Doe sent you a friend request",
        receivedAt: new Date("2025-11-09T07:03:55.163Z"),
        sentBy: {
          id: "12313212",
          displayName: "John Doe",
          avatarUrl: "https://i.pravatar.cc/150?u=john@example.com",
        },
      },
      {
        id: "vn7gez8x120b8tmivbz5sxlr",
        type: "project:mention",
        title: "Marta Pauleta mentioned you in Mantine",
        receivedAt: new Date("2025-11-09T06:33:55.163Z"),
        sentBy: {
          id: "12313212",
          displayName: "Marta Pauleta",
          avatarUrl: "https://i.pravatar.cc/150?u=marta@example.com",
        },
      },
    ],
    []
  );

  const hasNewNotifications = true;

  return (
    <>
      <Tooltip label="Notifications">
        <Indicator
          inline
          withBorder
          offset={6}
          size={12}
          processing={hasNewNotifications}
          disabled={!hasNewNotifications}
        >
          <ActionIcon
            variant="transparent"
            c="inherit"
            onClick={open}
            {...props}
          >
            <NotificationsIcon size="100%" />
          </ActionIcon>
        </Indicator>
      </Tooltip>

      <Drawer.Root
        position="right"
        opened={opened}
        onClose={close}
        size="380px"
      >
        <Drawer.Overlay />
        <Drawer.Content pos="relative">
          <Drawer.Header>
            <Drawer.Title mr="1rem">Notifications</Drawer.Title>
            <Button size="compact-sm" variant="subtle">
              View all
            </Button>
            <Drawer.CloseButton />
          </Drawer.Header>

          <Drawer.Body p="0">
            {notifications?.map((notification) => (
              <Notification
                key={notification.id}
                title={notification.title}
                receivedAt={notification.receivedAt}
                scope={notification.type.split(":").at(0)}
                icon={
                  <Avatar
                    src={notification.sentBy.avatarUrl}
                    alt={notification.sentBy.displayName}
                  />
                }
              />
            ))}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </>
  );
}
