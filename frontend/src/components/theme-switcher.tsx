"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ThemeSwitcherProps = {
  variant?: "icon" | "icon-only" | "dropdown-menu";
  className?: string;
};

export function ThemeSwitcher({ variant = "icon-only", className }: ThemeSwitcherProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const currentTheme = resolvedTheme ?? theme ?? "light";
  const isDark = currentTheme === "dark";

  const Icon = isDark ? Moon : Sun;

  if (variant === "dropdown-menu") {
    return (
      <Select value={isDark ? "dark" : "light"} onValueChange={setTheme}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent className="w-full" position="item-aligned">
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Button
      variant="outline"
      size={variant === "icon" ? "icon" : "icon-sm"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
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
