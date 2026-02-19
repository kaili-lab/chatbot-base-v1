import "server-only";

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not set");
}

const authBaseUrl = process.env.BETTER_AUTH_URL;

if (!authBaseUrl) {
  throw new Error("BETTER_AUTH_URL is not set");
}

const authBaseUrlValue = authBaseUrl;

const resendFrom = process.env.RESEND_FROM ?? "Chatbot Base <onboarding@resend.dev>";
const resend = new Resend(resendApiKey);

type ResendError = {
  name?: string;
  message?: string;
  statusCode?: number | null;
  status?: number | null;
};

function buildVerificationUrl(token: string) {
  const base = new URL(authBaseUrlValue);
  const basePath = base.pathname.replace(/\/$/, "");
  const authPath = basePath.endsWith("/api/auth") ? basePath : `${basePath}/api/auth`;
  const url = new URL(base);

  url.pathname = `${authPath}/verify-email`;
  url.searchParams.set("token", token);
  // 统一回到登录页，避免验证完成后落到占位提示页
  url.searchParams.set("callbackURL", "/login?verified=1");

  return url.toString();
}

function extractResendTestRecipient(errorMessage?: string) {
  if (!errorMessage) {
    return null;
  }

  const match = errorMessage.match(/\(([^()\s]+@[^()\s]+)\)/);
  return match?.[1] ?? null;
}

function isResendTestingModeBlocked(error: ResendError) {
  const statusCode = error.statusCode ?? error.status;
  return (
    statusCode === 403 &&
    resendFrom.toLowerCase().includes("onboarding@resend.dev")
  );
}

function formatResendErrorMessage(error: ResendError) {
  if (isResendTestingModeBlocked(error)) {
    return "Resend 处于测试发信模式：当前 from 地址只能发送到账号邮箱。请配置已验证域名的 RESEND_FROM。";
  }

  return error.message ?? "发送验证邮件失败，请稍后重试。";
}

async function sendWithResend(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const response = await resend.emails.send({
    from: resendFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (!response.error) {
    return;
  }

  // 在 Resend 测试模式下自动回退到账号邮箱，保证本地调试可拿到验证链接
  if (isResendTestingModeBlocked(response.error)) {
    const testRecipient = extractResendTestRecipient(response.error.message);

    if (testRecipient) {
      const fallbackResponse = await resend.emails.send({
        from: resendFrom,
        to: testRecipient,
        subject: `[DEV FORWARD] ${params.subject}`,
        html: `
          ${params.html}
          <p style="margin-top: 16px; color: #64748b;">
            Original recipient: ${params.to}
          </p>
        `,
      });

      if (!fallbackResponse.error) {
        console.warn(
          `[email] Resend test mode detected, verification email forwarded to account inbox (${testRecipient}).`
        );
        return;
      }

      throw new Error(formatResendErrorMessage(fallbackResponse.error));
    }
  }

  throw new Error(formatResendErrorMessage(response.error));
}

export async function sendVerificationEmail(to: string, token: string) {
  const verificationUrl = buildVerificationUrl(token);

  await sendWithResend({
    to,
    subject: "请验证你的邮箱",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">验证你的邮箱</h2>
        <p>欢迎使用 Chatbot Base，请点击下方按钮完成邮箱验证：</p>
        <p style="margin: 20px 0;">
          <a
            href="${verificationUrl}"
            style="display: inline-block; padding: 10px 16px; border-radius: 8px; background: #2563eb; color: #fff; text-decoration: none;"
          >
            验证邮箱
          </a>
        </p>
        <p>如果按钮无法点击，可复制下面链接到浏览器打开：</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
      </div>
    `,
  });
}
