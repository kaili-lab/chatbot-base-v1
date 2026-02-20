"use client";

import dynamic from "next/dynamic";
import type { CSSProperties, ImgHTMLAttributes } from "react";

const MarkdownPreview = dynamic(
  async () => (await import("@uiw/react-md-editor")).default.Markdown,
  { ssr: false }
);

type SafeMarkdownPreviewProps = {
  source: string;
  className?: string;
  style?: CSSProperties;
};

function getSafeImageSrc(source?: string | Blob | null) {
  // WHAT: 过滤 Markdown 图片链接；WHY: 避免相对路径触发错误路由/请求，同时保留可控的静态与远程图片。
  if (!source || typeof source !== "string") {
    return null;
  }

  const normalized = source.trim();

  if (!normalized) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("/") && !normalized.startsWith("//")) {
    return normalized;
  }

  return null;
}

type MarkdownImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  node?: unknown;
};

const markdownComponents = {
  img: ({ src, alt, ...props }: MarkdownImageProps) => {
    const safeSrc = getSafeImageSrc(src);

    if (!safeSrc) {
      return (
        <span className="text-xs text-muted-foreground">
          {alt ? "图片已屏蔽：" + alt : "图片已屏蔽"}
        </span>
      );
    }

    const { node, ...rest } = props;

    void node;

    return <img src={safeSrc} alt={alt ?? ""} {...rest} />;
  },
};

export function SafeMarkdownPreview({
  source,
  className,
  style,
}: SafeMarkdownPreviewProps) {
  return (
    <div data-color-mode="light" className="wmde-markdown-var">
      <MarkdownPreview
        source={source}
        className={className}
        style={{
          backgroundColor: "transparent",
          color: "inherit",
          ...style,
        }}
        components={markdownComponents}
      />
    </div>
  );
}
