"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

type ResendVerificationButtonProps = {
  email: string | null;
};

export function ResendVerificationButton({ email }: ResendVerificationButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email || isSubmitting) return;

    setStatusMessage(null);
    setIsSubmitting(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
      });

      if (error) {
        setStatusMessage(error.message ?? "发送失败，请稍后重试");
        return;
      }

      setStatusMessage("验证邮件已重新发送，请注意查收。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button className="w-full" disabled={!email || isSubmitting} onClick={handleResend}>
        {isSubmitting ? "发送中..." : "重新发送验证邮件"}
      </Button>
      {statusMessage && <p className="text-center text-xs text-muted-foreground">{statusMessage}</p>}
    </div>
  );
}
