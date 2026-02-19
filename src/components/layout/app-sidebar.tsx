"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Hexagon, MessageSquare, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/client";
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
  const { data: session, isPending } = useSession();
  const displayName = isPending
    ? "加载中..."
    : session?.user?.name || session?.user?.email || "未登录";
  const avatarLabel = isPending
    ? "…"
    : displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <Sidebar className="relative">
      <SidebarCollapseButton />

      {/* Logo */}
      <SidebarHeader>
        <Link href="/chat" className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Hexagon className="size-4" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight">Agent</span>
          )}
        </Link>
      </SidebarHeader>

      {/* 导航 */}
      <SidebarContent>
        <nav className="grid gap-0.5 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      {/* 用户信息占位 */}
      <SidebarFooter>
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
            {avatarLabel}
          </div>
          {!collapsed && (
            <span className="truncate text-sm font-medium">{displayName}</span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
