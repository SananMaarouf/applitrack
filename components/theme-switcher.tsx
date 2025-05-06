"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ThemeSwitcherProps {
  variant?: "full" | "icon-only";
}

const ThemeSwitcher = ({ variant = "full" }: ThemeSwitcherProps) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = variant === "icon-only" ? 20 : 16;

  // Get the current theme icon
  const ThemeIcon = () => {
    if (theme === "light") return <Sun size={ICON_SIZE} />;
    if (theme === "dark") return <Moon size={ICON_SIZE} />;
    return <Laptop size={ICON_SIZE} />;
  };

  return (
    <Select value={theme} onValueChange={(value) => setTheme(value)}>
      <SelectTrigger
        className={`
          h-full transition-all duration-300
          ${variant === "icon-only"
            ? "w-full justify-center text-foreground bg-background border-none hover:bg-card hover:text-card-foreground"
            : "w-full bg-card text-card-foreground hover:bg-hover"}
        `}
      >
        <SelectValue placeholder="Select theme">
          {variant === "full" ? (
            <div className="flex items-center gap-2">
              <ThemeIcon />
              <span>
                {theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}
              </span>
            </div>
          ) : (
            <ThemeIcon />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-card text-card-foreground flex ">
        <SelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun size={ICON_SIZE} /> <span>Light</span>
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center gap-2">
            <Moon size={ICON_SIZE} /> <span>Dark</span>
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center gap-2">
            <Laptop size={ICON_SIZE} /> <span>System</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export { ThemeSwitcher };