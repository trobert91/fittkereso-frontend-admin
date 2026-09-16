"use client";

import { useState } from "react";
import { ActionIcon, Avatar, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { PiSignOut } from "react-icons/pi";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { logoutUser, selectUser } from "@/store/slices/auth-slice";
import { useAppDispatch } from "@/store/store-hooks";
import { routes } from "@/utils/routes";
import classes from "./shell.module.scss";

/**
 * Who is signed in, and the way out - at the foot of the menu.
 *
 * The old header's avatar menu only ever called router.push('/auth/login'), which left the
 * session and the persisted Redux store intact: the next visit walked straight back in. This
 * dispatches the logout thunk, so the API call happens and the store is cleared before the
 * redirect.
 */
export function RailUser() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useSelector(selectUser);
  const [busy, setBusy] = useState(false);

  const initials = user?.email?.slice(0, 2)?.toUpperCase() ?? "?";

  const handleLogout = async () => {
    setBusy(true);
    try {
      // The thunk swallows API failures on purpose - local state is cleared either way, so a
      // dead backend can never trap somebody in a session they have asked to leave.
      await dispatch(logoutUser());
      router.push(routes.auth.login);
    } catch (err) {
      setBusy(false);
      notifications.show({
        color: "red",
        title: "Could not log out",
        message: err instanceof Error ? err.message : "An error occurred",
      });
    }
  };

  return (
    <div className={classes.row}>
      <span className={classes.gutter}>
        <Avatar size={26} radius="xl" color="blue">
          {initials}
        </Avatar>
      </span>

      <Text size="xs" c="dimmed" truncate className={classes.userEmail}>
        {user?.email ?? "Not signed in"}
      </Text>

      <span className={classes.reveal}>
        <Tooltip label="Log out" position="right">
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label="Log out"
            loading={busy}
            onClick={handleLogout}
          >
            <PiSignOut size="1.05rem" />
          </ActionIcon>
        </Tooltip>
      </span>
    </div>
  );
}
