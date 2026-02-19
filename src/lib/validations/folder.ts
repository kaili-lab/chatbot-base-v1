import { z } from "zod";

export const folderNameSchema = z
  .string()
  .trim()
  .min(1, "文件夹名称不能为空")
  .max(100, "文件夹名称不能超过 100 个字符");

export const folderIdSchema = z.string().uuid("文件夹 ID 非法");
