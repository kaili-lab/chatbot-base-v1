"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { authClient } from "@/lib/auth/client";

export function AppHeader() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4 lg:px-5 dark:bg-background">
      <SidebarTrigger className="lg:hidden" />
      <Separator orientation="vertical" className="mr-2 h-4 lg:hidden" />
      <BreadcrumbNav />

      <div className="ml-auto flex items-center gap-1">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 w-[190px] border-0 bg-muted pl-8 text-xs shadow-none lg:w-[210px]"
            readOnly
          />
        </div>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="退出登录"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
