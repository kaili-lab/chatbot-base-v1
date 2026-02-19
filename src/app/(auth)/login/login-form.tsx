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

        setFormError(error.message ?? "登录失败，请稍后重试");
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
        setGoogleError(error.message ?? "Google 登录失败，请稍后重试");
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Hexagon className="size-5" />
        </div>
        <CardTitle className="text-xl">欢迎回来</CardTitle>
        <p className="text-sm text-muted-foreground">
          请输入账号信息以继续使用 Agent
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {verified && (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            邮箱验证成功，请使用账号登录。
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={isGoogleSubmitting}
          onClick={handleGoogleSignIn}
        >
          <span className="flex size-5 items-center justify-center rounded-full border text-xs">
            G
          </span>
          {isGoogleSubmitting ? "跳转中..." : "使用 Google 登录"}
        </Button>
        {googleError && <p className="text-sm text-destructive">{googleError}</p>}
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            或
          </span>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              邮箱
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
              密码
            </label>
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "登录中..." : "登录"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <span className="text-sm text-muted-foreground">
          还没有账号？
          <Link href="/register" className="ml-1 font-medium text-blue-600">
            注册
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
