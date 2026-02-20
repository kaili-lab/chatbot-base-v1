import { z } from "zod";

import { DEFAULT_EMBEDDING_MODEL } from "../llm/constants";

export const settingsSchema = z.object({
  baseUrl: z.string().url("请输入合法的 API Base URL"),
  apiKey: z.string().min(1, "API Key 不能为空"),
  model: z.string().min(1, "模型名称不能为空"),
  embeddingModel: z
    .string()
    .min(1, "Embedding 模型不能为空")
    .refine((value) => value === DEFAULT_EMBEDDING_MODEL, {
      message: `当前仅支持 ${DEFAULT_EMBEDDING_MODEL}`,
    }),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export type SettingsFieldErrors = Partial<Record<keyof SettingsInput, string>>;
