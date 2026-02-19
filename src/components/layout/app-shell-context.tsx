"use client";

import { createContext, useContext, useState } from "react";

const SidebarAddonContext = createContext<React.ReactNode>(null);
const SidebarAddonSetterContext = createContext<
  ((addon: React.ReactNode) => void) | null
>(null);

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [sidebarAddon, setSidebarAddon] = useState<React.ReactNode>(null);

  return (
    <SidebarAddonSetterContext.Provider value={setSidebarAddon}>
      <SidebarAddonContext.Provider value={sidebarAddon}>
        {children}
      </SidebarAddonContext.Provider>
    </SidebarAddonSetterContext.Provider>
  );
}

export function useAppShellSidebarAddon() {
  return useContext(SidebarAddonContext);
}

export function useSetAppShellSidebarAddon() {
  const context = useContext(SidebarAddonSetterContext);
  if (!context) {
    throw new Error("useSetAppShellSidebarAddon 必须在 AppShellProvider 中使用");
  }

  return context;
}
