import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { setTheme, THEME_STORAGE_KEY } from "@/lib/theme";

function setSystemPreference(prefersDark: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: prefersDark,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    setTheme("light");
  });

  it("toggles the dark class on documentElement and persists to localStorage", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    expect(document.documentElement.classList.contains("dark")).toBe(false);

    fireEvent.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    fireEvent.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("restores the persisted choice on reload", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    document.documentElement.classList.remove("dark");
    const theme = await import("@/lib/theme");
    theme.setTheme(theme.readTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("follows the system preference when nothing is stored", async () => {
    window.localStorage.clear();
    setSystemPreference(true);
    const theme = await import("@/lib/theme");
    expect(theme.readTheme()).toBe("dark");
    setSystemPreference(false);
    expect(theme.readTheme()).toBe("light");
  });
});
