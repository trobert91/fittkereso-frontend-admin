"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/store-hooks";
import { AdminUser } from "@/models/admin-user";
import { setUser } from "@/store/slices/user-slice";
import { UserDetails } from "./UserDetails";

export function UserDetailsHydrator({ user }: { user: AdminUser }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (user) dispatch(setUser(user));
  }, [user, dispatch]);

  return <UserDetails />;
}
