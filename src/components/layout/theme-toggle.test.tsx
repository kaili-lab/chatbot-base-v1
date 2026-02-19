import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ThemeToggle } from "@/components/layout/theme-toggle";

const setThemeMock = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: setThemeMock,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    setThemeMock.mockClear();
  });

  it("点击后切换到暗色主题", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "切换主题" }));

    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });
});
