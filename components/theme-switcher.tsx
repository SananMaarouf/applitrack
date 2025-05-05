"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Laptop, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  return (
    <div className="w-full h-full">
      <Select value={theme} onValueChange={(value) => setTheme(value)}>
        <SelectTrigger className="w-full h-full border-2 bg-card text-card-foreground border-foreground">
          <SelectValue placeholder="Select theme">
            <div className="flex items-center gap-2">
              {theme === "light" ? (
                <Sun size={ICON_SIZE} />
              ) : theme === "dark" ? (
                <Moon size={ICON_SIZE} />)
                : (<Laptop size={ICON_SIZE} />
                )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-card text-card-foreground">
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
    </div>
  );
};

export { ThemeSwitcher };