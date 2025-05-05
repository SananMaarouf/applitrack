import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Settings, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <section className="flex h-full gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Menu className="
              w-14 h-full bg-background 
              border border-background 
              hover:text-card-foreground hover:bg-hover 
              hover:border-background p-2 rounded-md"
          />
        </SheetTrigger>
        <SheetContent side="right" className="
            w-3/4 flex flex-col
            items-center
          ">
          <SheetHeader>
            <SheetTitle className="sr-only">
              Settings sheet for changing theme, going to settings page and signing out.
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col justify-between w-full h-full">
            {/* Top section with settings and theme */}
            <div className="flex flex-col gap-2 w-full mt-6">
              <Link href="/dashboard/settings" className="
                  w-full px-2 py-3 
                  text-sm rounded-md
                  bg-foreground text-card-foreground
                  transition-colors duration-300 
                  text-center hover:bg-hover
                ">
                Settings
              </Link>
              <div className="mt-10">
                <SheetDescription className="text-left text-foreground mb-2">
                  Change theme:
                </SheetDescription>
                <ThemeSwitcher />
              </div>
            </div>

            {/* Bottom section with sign out */}
            <div className="w-full mb-6 mt-auto">
              <form action={signOutAction} className="w-full">
                <button
                  type="submit"
                  className="
                      w-full px-2 bg-foreground 
                      text-card-foreground py-3 
                      text-sm rounded-md text-center
                      transition-colors duration-300 
                      hover:bg-hover
                    ">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  ) : (
    // non-authenticated users...
    <section className="flex h-full gap-2">
        <ThemeSwitcher />
        <Button asChild variant={"default"} size={"fill"}>
          <Link href="/sign-in">Get started</Link>
        </Button>
    </section>
  );
}