import React from "react";
import type { Metadata } from "next";
import { AccountService } from "@/services/account.service";
import { getSessionUser } from "@/lib/auth/session";
import { AddressBook } from "./AddressBook";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved addresses",
  robots: { index: false, follow: false },
};

export default async function AccountAddressesPage() {
  const user = await getSessionUser();
  if (!user) return null;

  // Loaded on the server so the first paint already shows the address book,
  // rather than a spinner that then fills in.
  const addresses = await AccountService.getAddresses(user.id);

  return <AddressBook initialAddresses={addresses} />;
}
