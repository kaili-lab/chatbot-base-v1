import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login - Chatbot Base" };

type LoginPageProps = {
  searchParams: Promise<{
    verified?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { verified } = await searchParams;
  const isVerified = verified === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <LoginForm verified={isVerified} />
    </div>
  );
}
