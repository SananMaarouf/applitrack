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
      <ThemeSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Settings
            className="
              w-14 h-full bg-background 
              border border-background 
              hover:text-card-foreground hover:bg-hover 
              hover:border-background p-2 rounded-md"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card text-card-foreground">
          <DropdownMenuLabel className="font-bold">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link
            href="/dashboard/settings"
            className="
              w-full flex px-2 py-1.5 text-sm 
              rounded-md text-left hover:bg-hover 
              hover:text-card-foreground"
          >
            Settings
          </Link>
          <DropdownMenuSeparator />
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full  px-2 py-1.5 text-sm rounded-md text-left hover:bg-hover hover:text-card-foreground"
            >
              Sign out
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  ) : (
    <section className="flex h-full gap-2">
      <div className="hidden md:flex gap-2 items-center">
        <ThemeSwitcher />
        <Button asChild variant={"default"} size={"fill"}>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild variant={"default"} size={"fill"}>
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
      <div className="md:hidden flex gap-2 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Menu
              className="
              w-14 h-full bg-background 
              border border-background 
              hover:text-card-foreground hover:bg-hover 
              hover:border-background p-2 rounded-md"
            />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-3/4 flex flex-col gap-2 items-center"
          >
            <SheetHeader>
              <SheetTitle className="sr-only">
                Select actions to change theme, sign in and sign up.
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 w-full h-1/2 mt-12">
            <div className="flex flex-col gap-2 w-full h-1/3">
              <Button asChild variant={"default"} size={"fill"}>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant={"default"} size={"fill"}>
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </div>
              <div className="mt-10">
                <SheetDescription className="text-left text-foreground">
                  Change theme:
                </SheetDescription>
                <ThemeSwitcher />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </section>
  );
}
