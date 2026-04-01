"use client";
import { useSession } from "@/lib/auth-client";
import React from "react";

export default function User() {
  const { data } = useSession();
  console.log(data);
  return (
    <div className="">
      <h1 className="text-2xl font-bold">User Profile</h1>
      <p>Name: {data?.user?.name}</p>
      <p>Email: {data?.user?.email}</p>
    </div>
  );
}
