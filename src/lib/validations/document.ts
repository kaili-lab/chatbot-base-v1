import { z } from "zod";

export const documentIdSchema = z.string().uuid("文档 ID 非法");

export const noteTitleSchema = z
  .string()
  .trim()
  .min(1, "笔记标题不能为空")
  .max(120, "笔记标题不能超过 120 个字符");

export const noteContentSchema = z
  .string()
  .max(1_000_000, "笔记内容过长，请拆分后再保存");

export const documentFileNameSchema = z
  .string()
  .trim()
  .min(1, "文件名不能为空")
  .max(120, "文件名不能超过 120 个字符")
  .refine((value) => !value.startsWith(".") && !value.endsWith("."), "文件名格式不合法")
  .refine((value) => !/[\\/:*?"<>|]/.test(value), "文件名包含非法字符");
