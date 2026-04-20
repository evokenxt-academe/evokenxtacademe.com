"use client";
import * as React from "react";

interface VerifyEmailProps {
  token: string | undefined;
  callbackURL: string | undefined;
  errorCallbackURL: string | undefined;
  newUserCallbackURL: string | undefined;
}

export function VerifyEmail({
  callbackURL,
  errorCallbackURL,
  newUserCallbackURL,
  token,
}: VerifyEmailProps) {
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Verifying your email...</h1>
    </div>
  );
}
