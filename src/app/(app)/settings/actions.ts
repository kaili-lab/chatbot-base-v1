"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { embed, generateText } from "ai";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import {
  settingsSchema,
  type SettingsFieldErrors,
  type SettingsInput,
} from "@/lib/validations/settings";

import { API_KEY_MASK, type StoredSettings } from "./constants";

type ActionResult = {
  success: boolean;
  message?: string;
  fieldErrors?: SettingsFieldErrors;
};

type ConnectionResult = {
  success: boolean;
  error?: string;
};

type TestConnectionResult = {
  llm: ConnectionResult;
  embedding: ConnectionResult;
};

async function getCurrentUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

function formatValidationErrors(input: SettingsInput): SettingsFieldErrors {
  const result = settingsSchema.safeParse(input);
  if (result.success) {
    return {};
  }

  const errors = result.error.flatten().fieldErrors;

  return {
    baseUrl: errors.baseUrl?.[0],
    apiKey: errors.apiKey?.[0],
    model: errors.model?.[0],
    embeddingModel: errors.embeddingModel?.[0],
  };
}

async function resolveApiKeyForSave(userId: string, apiKey: string) {
  if (apiKey !== API_KEY_MASK) {
    return encrypt(apiKey);
  }

  const existing = await db.query.settings.findFirst({
    where: eq(settings.userId, userId),
    columns: {
      llmApiKey: true,
    },
  });

  if (!existing?.llmApiKey) {
    throw new Error("请先填写 API Key");
  }

  return existing.llmApiKey;
}

async function resolveApiKeyForTest(userId: string, apiKey: string) {
  if (apiKey !== API_KEY_MASK) {
    return apiKey;
  }

  const existing = await db.query.settings.findFirst({
    where: eq(settings.userId, userId),
    columns: {
      llmApiKey: true,
    },
  });

  if (!existing?.llmApiKey) {
    throw new Error("请先保存 API Key 再测试连接");
  }

  return decrypt(existing.llmApiKey);
}

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "请先修正表单错误",
      fieldErrors: formatValidationErrors(input),
    };
  }

  try {
    const encryptedApiKey = await resolveApiKeyForSave(userId, parsed.data.apiKey);

    await db
      .insert(settings)
      .values({
        userId,
        llmBaseUrl: parsed.data.baseUrl,
        llmApiKey: encryptedApiKey,
        llmModel: parsed.data.model,
        embeddingModel: parsed.data.embeddingModel,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: settings.userId,
        set: {
          llmBaseUrl: parsed.data.baseUrl,
          llmApiKey: encryptedApiKey,
          llmModel: parsed.data.model,
          embeddingModel: parsed.data.embeddingModel,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/settings");

    return {
      success: true,
      message: "设置已保存",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败，请稍后重试";

    return {
      success: false,
      message,
    };
  }
}

export async function getSettings(): Promise<StoredSettings | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const row = await db.query.settings.findFirst({
    where: eq(settings.userId, userId),
  });

  if (!row) {
    return null;
  }

  return {
    baseUrl: row.llmBaseUrl ?? "",
    apiKey: row.llmApiKey ? decrypt(row.llmApiKey) : "",
    model: row.llmModel ?? "",
    embeddingModel: row.embeddingModel ?? "",
  };
}

export async function testConnection(
  input: SettingsInput
): Promise<TestConnectionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      llm: {
        success: false,
        error: "登录状态已失效，请重新登录",
      },
      embedding: {
        success: false,
        error: "登录状态已失效，请重新登录",
      },
    };
  }

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      llm: {
        success: false,
        error: "请先修正表单错误",
      },
      embedding: {
        success: false,
        error: "请先修正表单错误",
      },
    };
  }

  try {
    const apiKey = await resolveApiKeyForTest(userId, parsed.data.apiKey);
    const provider = createOpenAI({
      apiKey,
      baseURL: parsed.data.baseUrl,
    });

    const llmResult: ConnectionResult = { success: true };
    const embeddingResult: ConnectionResult = { success: true };

    try {
      await generateText({
        model: provider(parsed.data.model),
        messages: [{ role: "user", content: "hi" }],
        maxOutputTokens: 16,
      });
    } catch (error) {
      llmResult.success = false;
      llmResult.error = error instanceof Error ? error.message : "LLM 连接失败";
    }

    try {
      await embed({
        model: provider.textEmbeddingModel(parsed.data.embeddingModel),
        value: "test",
      });
    } catch (error) {
      embeddingResult.success = false;
      embeddingResult.error =
        error instanceof Error ? error.message : "Embedding 连接失败";
    }

    return {
      llm: llmResult,
      embedding: embeddingResult,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "测试连接失败";

    return {
      llm: {
        success: false,
        error: message,
      },
      embedding: {
        success: false,
        error: message,
      },
    };
  }
}
