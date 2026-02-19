"use client";

import { LogOut, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      {/* 左侧：移动端菜单 + 面包屑 */}
      <SidebarTrigger className="lg:hidden" />
      <Separator orientation="vertical" className="mr-2 h-4 lg:hidden" />
      <BreadcrumbNav />

      {/* 右侧工具栏 */}
      <div className="ml-auto flex items-center gap-1">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-9 w-[200px] pl-8 lg:w-[260px]"
            readOnly
          />
        </div>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="退出登录"
          onClick={() => {}}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
