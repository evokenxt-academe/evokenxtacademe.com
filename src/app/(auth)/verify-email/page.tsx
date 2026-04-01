import { VerifyEmail } from "@/components/verify-email";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    callbackURL?: string;
    errorCallbackURL?: string;
    newUserCallbackURL?: string;
  }>;
}) {
  const params = await searchParams;
  console.log(params);

  return (
    <div className="flex items-center justify-center h-screen">
      <VerifyEmail
        token={params.token}
        callbackURL={params.callbackURL}
        errorCallbackURL={decodeURIComponent(params.errorCallbackURL! || "/")}
        newUserCallbackURL={params.newUserCallbackURL}
      />
      <h1>Verify Email</h1>
    </div>
  );
}
