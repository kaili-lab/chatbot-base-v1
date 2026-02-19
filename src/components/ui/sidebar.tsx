"use client";

import * as React from "react";
import { ChevronLeft, PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SIDEBAR_WIDTH = "13.5rem";
const SIDEBAR_WIDTH_COLLAPSED = "3.5rem";

type SidebarContextValue = {
  collapsed: boolean;
  open: boolean;
  isMobile: boolean;
  setCollapsed: (value: boolean) => void;
  setOpen: (value: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar 组件需要包裹在 SidebarProvider 中使用");
  }
  return context;
}

type SidebarProviderProps = {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
};

function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (!e.matches) setOpen(false);
    };
    onChange(mql);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ collapsed, open, isMobile, setCollapsed, setOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

const Sidebar = React.forwardRef<
  React.ElementRef<"aside">,
  React.ComponentPropsWithoutRef<"aside">
>(({ className, children, ...props }, ref) => {
  const { collapsed, open, isMobile, setOpen } = useSidebar();

  return (
    <>
      {isMobile && open ? (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        ref={ref}
        data-collapsed={collapsed}
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-collapsed": SIDEBAR_WIDTH_COLLAPSED,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground transition-[width,transform] duration-200 ease-in-out lg:static lg:z-auto lg:h-auto lg:min-h-screen",
          collapsed
            ? "w-[var(--sidebar-width-collapsed)]"
            : "w-[var(--sidebar-width)]",
          isMobile && "-translate-x-full",
          isMobile && open && "translate-x-0",
          !isMobile && "translate-x-0",
          className
        )}
        {...props}
      >
        {children}
      </aside>
    </>
  );
});
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-14 items-center gap-2 px-4", className)}
    {...props}
  />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-auto py-2", className)}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-auto border-t border-sidebar-border px-4 py-3", className)}
    {...props}
  />
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarInset = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden", className)}
    {...props}
  />
));
SidebarInset.displayName = "SidebarInset";

function SidebarCollapseButton({ className }: { className?: string }) {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <button
      type="button"
      aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
      onClick={() => setCollapsed(!collapsed)}
      className={cn(
        "absolute -right-3 top-5 z-10 hidden size-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-background text-sidebar-muted-foreground shadow-sm transition-colors hover:text-sidebar-foreground lg:flex",
        className
      )}
    >
      <ChevronLeft
        className={cn(
          "size-3.5 transition-transform duration-200",
          collapsed && "rotate-180"
        )}
      />
    </button>
  );
}

type SidebarTriggerProps = React.ComponentPropsWithoutRef<typeof Button>;

function SidebarTrigger({ className, ...props }: SidebarTriggerProps) {
  const { open, isMobile, collapsed, setOpen, setCollapsed } = useSidebar();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={
        isMobile
          ? open
            ? "关闭侧边栏"
            : "打开侧边栏"
          : collapsed
            ? "展开侧边栏"
            : "折叠侧边栏"
      }
      onClick={() => {
        if (isMobile) {
          setOpen(!open);
          return;
        }
        setCollapsed(!collapsed);
      }}
      {...props}
    >
      <PanelLeft className="size-4" />
    </Button>
  );
}

export {
  Sidebar,
  SidebarCollapseButton,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
