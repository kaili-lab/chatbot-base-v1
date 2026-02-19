import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "请输入用户名"),
    email: z.string().email("邮箱格式不正确"),
    password: z.string().min(8, "密码至少 8 位"),
    confirmPassword: z.string().min(8, "密码至少 8 位"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(8, "密码至少 8 位"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
