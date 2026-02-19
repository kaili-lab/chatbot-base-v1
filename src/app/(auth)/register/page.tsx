import type { Metadata } from "next";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register - Chatbot Base" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f5f9] px-4 py-10">
      <RegisterForm />
    </div>
  );
}
