"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Hexagon, MessageSquare, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/client";
import { useAppShellSidebarAddon } from "@/components/layout/app-shell-context";
import {
  Sidebar,
  SidebarCollapseButton,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const sidebarAddon = useAppShellSidebarAddon();
  const { data: session, isPending } = useSession();

  const displayName = isPending
    ? "Loading..."
    : session?.user?.name || session?.user?.email || "Guest User";

  const avatarLabel = isPending
    ? "…"
    : displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <Sidebar className="relative bg-[#f8fafc] dark:bg-[#0f1115]">
      <SidebarCollapseButton />

      <SidebarHeader className="h-16 border-b border-sidebar-border px-5">
        <Link href="/chat" className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#2f6df6] text-white">
            <Hexagon className="size-4" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight">Agent</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden py-3">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-[#dbeafe] text-[#2f6df6] dark:bg-[#1f2b3d] dark:text-[#8bb2ff]"
                    : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && sidebarAddon ? (
          <div className="mt-3 border-t border-sidebar-border px-2 pt-3">{sidebarAddon}</div>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="bg-[#f8fafc] dark:bg-[#0f1115]">
        <div
          className={cn(
            "flex items-center gap-2.5",
            collapsed && "justify-center"
          )}
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] text-xs font-semibold text-white">
            {avatarLabel}
          </div>
          {!collapsed && (
            <span className="truncate text-xs font-medium text-foreground/80">
              {displayName}
            </span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
