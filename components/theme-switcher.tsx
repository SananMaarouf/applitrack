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
      <Select value={theme} onValueChange={(value) => setTheme(value)}>
        <SelectTrigger className="
          w-full border-2 h-full 
          bg-card text-card-foreground border-foreground
          transition-colors duration-300
          hover:text-card-foreground hover:bg-hover
          
          ">
          <SelectValue placeholder="Select theme">
            <div className="flex items-center gap-2">
              {theme === "light" ? (
                <>
                  <Sun size={ICON_SIZE} /> 
                  <span>Light</span>
                </>
              ) : theme === "dark" ? (
                <>
                  <Moon size={ICON_SIZE} /> 
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Laptop size={ICON_SIZE} /> 
                  <span>System</span>
                </>
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
  );
};

export { ThemeSwitcher };