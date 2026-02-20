"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_EMBEDDING_MODEL } from "@/lib/llm/constants";

import { saveSettings, testConnection } from "./actions";
import { API_KEY_MASK, type StoredSettings } from "./constants";

type SettingsFormProps = {
  initialValues: StoredSettings;
  hasStoredApiKey: boolean;
};

type FormValues = {
  baseUrl: string;
  apiKey: string;
  model: string;
  embeddingModel: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

export function SettingsForm({ initialValues, hasStoredApiKey }: SettingsFormProps) {
  const [values, setValues] = useState<FormValues>({
    ...initialValues,
    embeddingModel: DEFAULT_EMBEDDING_MODEL,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isTesting, startTesting] = useTransition();

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startSaving(async () => {
      const result = await saveSettings(values);
      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.message ?? "保存失败，请稍后重试");
        return;
      }

      setFieldErrors({});
      toast.success("保存成功");

      if (values.apiKey && values.apiKey !== API_KEY_MASK) {
        setValues((prev) => ({ ...prev, apiKey: API_KEY_MASK }));
      }
    });
  };

  const handleTestConnection = () => {
    startTesting(async () => {
      const result = await testConnection(values);

      if (result.llm.success) {
        toast.success("LLM 连接成功");
      } else {
        toast.error(`LLM 连接失败：${result.llm.error ?? "未知错误"}`);
      }

      if (result.embedding.success) {
        toast.success("Embedding 连接成功");
      } else {
        toast.error(`Embedding 连接失败：${result.embedding.error ?? "未知错误"}`);
      }
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>LLM 配置</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="space-y-2">
            <label htmlFor="base-url" className="text-sm font-medium">
              API Base URL
            </label>
            <Input
              id="base-url"
              placeholder="https://api.openai.com/v1"
              value={values.baseUrl}
              onChange={(event) => handleChange("baseUrl", event.target.value)}
            />
            {fieldErrors.baseUrl && (
              <p className="text-xs text-destructive">{fieldErrors.baseUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              API Key
            </label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={values.apiKey}
                onChange={(event) => handleChange("apiKey", event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"}
                onClick={() => setShowApiKey((prev) => !prev)}
              >
                {showApiKey ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            {hasStoredApiKey && values.apiKey === API_KEY_MASK && (
              <p className="text-xs text-muted-foreground">
                当前展示为掩码，保持不变可直接保存。
              </p>
            )}
            {fieldErrors.apiKey && (
              <p className="text-xs text-destructive">{fieldErrors.apiKey}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="text-sm font-medium">
              模型名称
            </label>
            <Input
              id="model"
              placeholder="gpt-4o"
              value={values.model}
              onChange={(event) => handleChange("model", event.target.value)}
            />
            {fieldErrors.model && (
              <p className="text-xs text-destructive">{fieldErrors.model}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="embedding-model" className="text-sm font-medium">
              Embedding 模型
            </label>
            <Input
              id="embedding-model"
              placeholder={DEFAULT_EMBEDDING_MODEL}
              value={DEFAULT_EMBEDDING_MODEL}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              当前仅支持 {DEFAULT_EMBEDDING_MODEL}，暂不开放修改。
            </p>
            {fieldErrors.embeddingModel && (
              <p className="text-xs text-destructive">{fieldErrors.embeddingModel}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving || isTesting}
              onClick={handleTestConnection}
            >
              {isTesting ? "测试中..." : "测试连接"}
            </Button>
            <Button type="submit" disabled={isSaving || isTesting}>
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
