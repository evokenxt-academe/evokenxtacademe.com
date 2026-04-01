"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { Spinner } from "./ui/spinner";
import { signIn } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z
    .string()
    .superRefine((val, ctx) => {
      if (!val || val.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email is required",
        });
        return;
      }

      if (val.length > 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email must be less than 50 characters",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid email address",
        });
      }
    })
    .transform((val) => val.toLowerCase()),
});

export function LoginCard() {
  const [isLoading, setIsLoading] = React.useState<{
    type: "magicLink" | "google" | "";
    status: boolean;
  }>({ type: "", status: false });

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading({ type: "magicLink", status: true });

      const { data, error } = await signIn.magicLink({
        email: value.email, // required
        name: value.email.split("@")[0],
        callbackURL: "/",
        newUserCallbackURL: "/",
        errorCallbackURL:
          "http://localhost:3000/error?type=magic-link&message=Something went wrong with link sign in. Please try again.",
      });

      if (error) {
        toast.error(error.message);
        setIsLoading({ type: "magicLink", status: false });
        form.setFieldValue("email", "");
        return;
      }

      toast.success("Magic link sent to your email!");
      setIsLoading({ type: "magicLink", status: false });
    },
  });

  const handleSignInWithGoogle = async () => {
    setIsLoading({ type: "google", status: true });

    const data = await signIn.social({
      provider: "google",
      callbackURL: "/",
      newUserCallbackURL: "/",
      errorCallbackURL:
        "http://localhost:3000/error?type=social&message=Something went wrong with Google sign in. Please try again.",
    });

    setIsLoading({ type: "google", status: false });
  };

  return (
    <Card className="w-full mx-5 sm:max-w-md">
      <CardHeader>
        <CardTitle>Sign in to your account</CardTitle>
        <CardDescription>
          Enter your email below to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          id="form-tanstack-input"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="youremail@gmail.com"
                      autoComplete={"email"}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
        <Button
          type="submit"
          className="w-full"
          form="form-tanstack-input"
          disabled={isLoading.status && isLoading.type === "magicLink"}
        >
          {isLoading.status && isLoading.type === "magicLink" && <Spinner />}
          Get started
        </Button>
        <Field>
          <FieldSeparator>Or continue with</FieldSeparator>
        </Field>
        <Button
          variant="outline"
          className="w-full relative"
          onClick={handleSignInWithGoogle}
          disabled={isLoading.status && isLoading.type === "google"}
        >
          {isLoading.status && isLoading.type === "google" && (
            <Spinner className="absolute top-2" />
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="800px"
            height="800px"
            viewBox="-3 0 262 262"
            preserveAspectRatio="xMidYMid"
          >
            <path
              d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
              fill="#4285F4"
            />
            <path
              d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
              fill="#34A853"
            />
            <path
              d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
              fill="#FBBC05"
            />
            <path
              d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
              fill="#EB4335"
            />
          </svg>{" "}
          Sign in with Google
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
