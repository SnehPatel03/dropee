"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // fallback redirect (optional safety)
    router.push("/dashboard");
  }, [router]);

  return <AuthenticateWithRedirectCallback />;
}