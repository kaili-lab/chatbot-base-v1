import { describe, expect, it } from "vitest";

import { settingsSchema } from "./settings";

describe("settingsSchema", () => {
  it("baseUrl 非 URL 格式被拒绝", () => {
    const result = settingsSchema.safeParse({
      baseUrl: "not-url",
      apiKey: "sk-test",
      model: "gpt-4o",
      embeddingModel: "text-embedding-3-small",
    });

    expect(result.success).toBe(false);
  });

  it("apiKey 为空被拒绝", () => {
    const result = settingsSchema.safeParse({
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4o",
      embeddingModel: "text-embedding-3-small",
    });

    expect(result.success).toBe(false);
  });
});
