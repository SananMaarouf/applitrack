"use client";

import { Moon, Sun, Laptop, Check } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ThemeSwitcherProps = {
  variant?: "icon" | "icon-only" | "dropdown-menu";
};

export function ThemeSwitcher({ variant = "icon-only" }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Laptop;

  if (variant === "dropdown-menu") {
    return (
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger>
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent className="w-full" position="item-aligned">
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  /* if no variant specified it defaults to icon-only */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="icon" aria-label="Toggle theme" className="">
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} className="justify-between">
          Light
          <Check className={`h-4 w-4 ml-4 ${theme === "light" ? "opacity-100" : "opacity-0"}`} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="justify-between">
          Dark
          <Check className={`h-4 w-4 ml-4 ${theme === "dark" ? "opacity-100" : "opacity-0"}`} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="justify-between">
          System
          <Check className={`h-4 w-4 ml-4 ${theme === "system" ? "opacity-100" : "opacity-0"}`} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
