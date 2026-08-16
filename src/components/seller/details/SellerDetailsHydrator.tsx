"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/store-hooks";
import { Seller } from "@/models/seller";
import { setSeller } from "@/store/slices/seller-slice";
import { SellerDetails } from "./SellerDetails";

export function SellerDetailsHydrator({ seller }: { seller: Seller }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (seller) dispatch(setSeller(seller));
  }, [seller, dispatch]);

  return <SellerDetails />;
}
