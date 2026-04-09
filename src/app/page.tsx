"use client";
import * as React from "react";
import { useUserSession } from "@/features/auth/store/use-user-session";

export default function Page() {
  const { user, isLoading, getSession } = useUserSession();

  React.useEffect(() => {
    getSession();
  }, []);
  console.log(user);

  return <ul>{isLoading ? "Loading..." : JSON.stringify(user)}</ul>;
}
