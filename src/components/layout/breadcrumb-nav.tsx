"use client";

import { usePathname } from "next/navigation";

function getPrimaryLabel(pathname: string) {
  if (pathname.startsWith("/chat")) return "Chat";
  if (pathname.startsWith("/documents")) return "Documents";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Workspace";
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const primaryLabel = getPrimaryLabel(pathname);

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <span className="text-sm text-foreground/85">{primaryLabel}</span>
    </nav>
  );
}
