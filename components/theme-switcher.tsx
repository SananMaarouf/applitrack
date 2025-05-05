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
    <section>
        {/* desktop view */}
      <div className="hidden md:flex gap-2 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="">
            <Button variant="switch" size={"fill"}>
              {theme === "light" ? (
                <Sun key="light" size={ICON_SIZE} className={""} />
              ) : theme === "dark" ? (
                <Moon key="dark" size={ICON_SIZE} className={""} />
              ) : (
                <Laptop key="system" size={ICON_SIZE} className={""} />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-card text-card-foreground"
          >
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(e) => setTheme(e)}
            >
              <DropdownMenuRadioItem className="flex gap-2" value="light">
                <Sun size={ICON_SIZE} /> <span>Light</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="flex gap-2" value="dark">
                <Moon size={ICON_SIZE} /> <span>Dark</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="flex gap-2" value="system">
                <Laptop size={ICON_SIZE} /> <span>System</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* mobile view */}
      <div className="md:hidden flex gap-2 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="p-2 border-2 border-foreground">
            <Button variant="switch" size={"fill"}>
              <Sun key="light" size={ICON_SIZE} className="mx-2" />
              /
              <Moon key="dark" size={ICON_SIZE} className="mx-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            
            className="w-full bg-card text-card-foreground"
          >
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(e) => setTheme(e)}
            >
              <DropdownMenuRadioItem className="flex gap-2" value="light">
                <Sun size={ICON_SIZE} /> <span>Light</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="flex gap-2" value="dark">
                <Moon size={ICON_SIZE} /> <span>Dark</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="flex gap-2" value="system">
                <Laptop size={ICON_SIZE} /> <span>System</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
};

export { ThemeSwitcher };
