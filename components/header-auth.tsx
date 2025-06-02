import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { signOutAction } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <section className="flex h-full gap-2 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Menu className="
              w-14 h-full bg-background 
              border border-background 
              transition-colors duration-300
              hover:text-card-foreground hover:bg-hover 
              hover:border-background p-2 rounded-md"
          />
        </SheetTrigger>
        <SheetContent side="right" className="w-3/4 flex flex-col items-center">
          <SheetHeader>
            <SheetTitle className="sr-only">
              Settings sheet for changing theme, going to settings page and signing out.
            </SheetTitle>
          </SheetHeader>
          <section className="flex flex-col justify-between w-full h-full">
            {/* Top section with settings and theme */}
            <section className="flex flex-col gap-2 w-full mt-10">

              <SheetClose asChild>
                <Link href="/dashboard/settings" className="
                  w-full px-2 py-3 
                  text-sm rounded-md
                  bg-foreground text-card-foreground
                  transition-colors duration-300 
                  text-center hover:bg-hover
                  border-foreground border
                  ">
                  Settings
                </Link>
              </SheetClose>
              <section className="mt-10">
                <SheetDescription className="text-left text-foreground mb-2">
                  Change theme:
                </SheetDescription>
                <section className="h-3/4">
                  <ThemeSwitcher />
                </section>
              </section>
            </section>

            {/* Bottom section with sign out */}
            <section className="w-full mb-6 mt-auto">
              <form action={signOutAction} className="w-full">
                <button
                  type="submit"
                  className="
                      w-full px-2 bg-foreground 
                      text-card-foreground py-3 
                      text-sm rounded-md text-center
                      transition-colors duration-300 
                      hover:bg-hover border-foreground border
                    ">
                  Sign out
                </button>
              </form>
            </section>
          </section>
        </SheetContent>
      </Sheet>
    </section>
  ) : (
    // non-authenticated users...
    <section className="flex h-full gap-2 z-50">
      <ThemeSwitcher variant="icon-only" />
      <Button asChild variant={"default"} size={"fill"}>
        <Link href="/auth">Get started</Link>
      </Button>
    </section>
  );
}