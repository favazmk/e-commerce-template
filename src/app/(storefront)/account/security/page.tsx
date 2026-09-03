import React from "react";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { SecurityPanel } from "./SecurityPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login & security",
  robots: { index: false, follow: false },
};

export default async function AccountSecurityPage() {
  const user = await getSessionUser();
  if (!user) return null;

  return <SecurityPanel email={user.email} />;
}
