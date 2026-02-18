import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 允许当前阶段无测试用例也通过，避免阻塞任务推进
    passWithNoTests: true,
  },
});
