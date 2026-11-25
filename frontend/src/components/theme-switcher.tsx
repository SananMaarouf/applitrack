"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

type ThemeSwitcherProps = {
  variant?: "icon" | "icon-only";
  className?: string;
};

export function useThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const currentTheme = resolvedTheme ?? theme ?? "light";
  const isDark = currentTheme === "dark";

  return {
    isDark,
    toggleTheme: () => setTheme(isDark ? "light" : "dark"),
  };
}

export function ThemeSwitcher({ variant = "icon-only", className }: ThemeSwitcherProps) {
  const { isDark, toggleTheme } = useThemeToggle();

  const Icon = isDark ? Moon : Sun;

  return (
    <Button
      variant="outline"
      size={variant === "icon" ? "icon" : "icon-sm"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={
        variant === "icon"
          ? className
          : `rounded-[8px] border-border bg-background ${className ?? ""}`
      }
    >
      <Icon className="size-4" />
    </Button>
  );
}
