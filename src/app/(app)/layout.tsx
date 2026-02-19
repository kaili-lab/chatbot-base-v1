import { AppHeader } from "@/components/layout/app-header";
import { AppShellProvider } from "@/components/layout/app-shell-context";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppShellProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <main className="flex-1 overflow-hidden">{children}</main>
          </SidebarInset>
        </div>
      </AppShellProvider>
    </SidebarProvider>
  );
}
