"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hexagon } from "lucide-react";

import { authClient } from "@/lib/auth/client";
import { loginSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const initialValues = {
  email: "",
  password: "",
};

type FieldErrors = Partial<Record<keyof typeof initialValues, string>>;

type LoginFormProps = {
  verified?: boolean;
};

function isEmailNotVerifiedError(error: { message?: string } | null) {
  if (!error?.message) return false;

  const message = error.message.toUpperCase();
  return message.includes("EMAIL_NOT_VERIFIED");
}

export function LoginForm({ verified = false }: LoginFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleChange = (field: keyof typeof initialValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setGoogleError(null);

    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (isEmailNotVerifiedError(error)) {
          const nextUrl = `/verify-email?email=${encodeURIComponent(values.email)}`;
          router.push(nextUrl);
          return;
        }

        setFormError(error.message ?? "Login failed, please try again later.");
        return;
      }

      router.push("/chat");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleSubmitting) return;

    setGoogleError(null);
    setFormError(null);
    setIsGoogleSubmitting(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/chat",
      });

      if (error) {
        setGoogleError(error.message ?? "Google sign-in failed, please try again later.");
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-[390px] border bg-white shadow-md">
      <CardHeader className="items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-[#2f6df6]">
          <Hexagon className="size-6 fill-current" />
          <span className="text-xl font-semibold tracking-tight">Agent</span>
        </div>
        <CardTitle className="text-3xl font-semibold">Welcome back</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {verified && (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            Email verified successfully. You can sign in now.
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full gap-2"
          disabled={isGoogleSubmitting}
          onClick={handleGoogleSignIn}
        >
          <span className="flex size-5 items-center justify-center rounded-full border text-xs">
            G
          </span>
          {isGoogleSubmitting ? "Redirecting..." : "Sign in with Google"}
        </Button>
        {googleError && <p className="text-sm text-destructive">{googleError}</p>}

        <div className="relative py-1">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[11px] text-muted-foreground">
            OR CONTINUE WITH
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={values.email}
              onChange={(event) => handleChange("email", event.target.value)}
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link href="/login" className="text-xs font-medium text-[#2f6df6]">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => handleChange("password", event.target.value)}
            />
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <Button
            type="submit"
            className="h-11 w-full bg-[#2f6df6] hover:bg-[#265fdb]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <span className="text-sm text-muted-foreground">
          Don&apos;t have an account?
          <Link href="/register" className="ml-1 font-medium text-[#2f6df6]">
            Sign up
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
