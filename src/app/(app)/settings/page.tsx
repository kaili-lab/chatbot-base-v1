import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { DEFAULT_EMBEDDING_MODEL } from "@/lib/llm/constants";

import { getSettings } from "./actions";
import { API_KEY_MASK } from "./constants";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings - Chatbot Base" };

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const savedSettings = await getSettings();

  return (
    <div className="flex h-full min-h-0 items-start justify-center px-4 py-6 md:items-center md:px-6 md:py-10">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">设置</h1>
        </div>

        <SettingsForm
          initialValues={{
            baseUrl: savedSettings?.baseUrl ?? "",
            apiKey: savedSettings?.apiKey ? API_KEY_MASK : "",
            model: savedSettings?.model ?? "",
            embeddingModel: savedSettings?.embeddingModel ?? DEFAULT_EMBEDDING_MODEL,
          }}
          hasStoredApiKey={Boolean(savedSettings?.apiKey)}
        />
      </div>
    </div>
  );
}
