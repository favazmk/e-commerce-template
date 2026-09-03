import React from "react";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function AccountProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;

  return <ProfileForm user={user} />;
}
