"use client"
import React from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
const dashboard = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/");
      }}
    >
      Logout
    </button>
  );
};

export default dashboard;
