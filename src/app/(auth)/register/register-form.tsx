"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hexagon } from "lucide-react";

import { authClient } from "@/lib/auth/client";
import { registerSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

type FieldErrors = Partial<Record<keyof typeof initialValues, string>>;

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof initialValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const result = registerSchema.safeParse(values);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setFieldErrors({
        name: errors.name?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
        confirmPassword: errors.confirmPassword?.[0],
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (error) {
        setFormError(error.message ?? "Registration failed, please try again later.");
        return;
      }

      const nextUrl = `/verify-email?email=${encodeURIComponent(values.email)}`;
      router.push(nextUrl);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-[390px] border bg-white shadow-md">
      <CardHeader className="items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-[#2f6df6]">
          <Hexagon className="size-6 fill-current" />
          <span className="text-xl font-semibold tracking-tight">Agent</span>
        </div>
        <CardTitle className="text-3xl font-semibold">Create an account</CardTitle>
        <p className="text-sm text-muted-foreground">Enter your information to get started</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="name"
              placeholder="John Doe"
              autoComplete="name"
              value={values.name}
              onChange={(event) => handleChange("name", event.target.value)}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>
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
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => handleChange("password", event.target.value)}
            />
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(event) =>
                handleChange("confirmPassword", event.target.value)
              }
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button
            type="submit"
            className="h-11 w-full bg-[#2f6df6] hover:bg-[#265fdb]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <span className="text-sm text-muted-foreground">
          Already have an account?
          <Link href="/login" className="ml-1 font-medium text-[#2f6df6]">
            Login
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
