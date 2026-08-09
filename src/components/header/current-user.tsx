"use client";

import { PiGearSixDuotone, PiSignOut, PiUser } from "react-icons/pi";
import { Avatar, AvatarProps, ElementProps, Menu } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/auth-slice";

type CurrentUserProps = Omit<AvatarProps, "src" | "alt"> &
  ElementProps<"div", keyof AvatarProps>;

export function CurrentUser(props: CurrentUserProps) {
  const router = useRouter();
  const user = useSelector(selectUser);

  const handleLogout = () => {
    void router.push("/auth/login");
  };

  return (
    <Menu>
      <Menu.Target>
        <Avatar {...props} style={{ cursor: "pointer", ...props.style }}>
          {user?.email?.slice(0, 2)?.toUpperCase()}
        </Avatar>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={
            <PiUser size="1rem" color="var(--mantine-color-red-6)" />
          }
        >
          {user?.email}
        </Menu.Item>

        <Menu.Label>Settings</Menu.Label>
        <Menu.Item leftSection={<PiGearSixDuotone size="1rem" />}>
          Account settings
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          leftSection={<PiSignOut size="1rem" />}
          onClick={handleLogout}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
