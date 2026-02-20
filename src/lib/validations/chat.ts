import { z } from "zod";

export const conversationIdSchema = z.string().uuid("对话 ID 非法");

export const conversationTitleSchema = z
  .string()
  .trim()
  .min(1, "对话标题不能为空")
  .max(120, "对话标题不能超过 120 个字符");

export const messageContentSchema = z
  .string()
  .trim()
  .min(1, "消息不能为空")
  .max(4000, "消息内容过长，请拆分后发送");
