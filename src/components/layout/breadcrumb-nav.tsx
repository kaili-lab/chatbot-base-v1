"use client";

import { usePathname } from "next/navigation";

const routeLabels: Record<string, string> = {
  chat: "Chat",
  documents: "Documents",
  settings: "Settings",
};

function formatSegment(segment: string) {
  if (routeLabels[segment]) {
    return routeLabels[segment];
  }
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const items = segments.map((segment) => formatSegment(segment));

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex items-center gap-1">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-center gap-1">
            <span className={index === items.length - 1 ? "text-foreground" : ""}>
              {item}
            </span>
            {index < items.length - 1 ? <span className="px-1">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
