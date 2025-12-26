import Link from "next/link";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button"
import { currentUser } from '@clerk/nextjs/server';
import { SignOutButton } from '@clerk/nextjs';
import { ThemeSwitcher } from "@/components/theme-switcher";
import { headers } from "next/headers";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default async function AuthButton() {
  const user = await currentUser();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";


  return user ? (
    <section className="flex h-full gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Menu className="
              w-14 h-full rounded-md duration-500 transition-colors
              hover:bg-primary hover:text-primary-foreground hover:cursor-pointer
              "
          />
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="text-2xl">
              Settings
            </SheetTitle>
            <SheetDescription className="text-xl">
              Manage your account and preferences
            </SheetDescription>
          </SheetHeader>

          <section className="flex flex-col justify-between w-full h-full">
            {/* Top section with settings and theme */}
            <section className="flex flex-col gap-2 w-full mt-10">

              <SheetClose asChild>
                <Link href="/dashboard/settings" className="w-11/12 mx-auto px-2 py-3 text-center bg-primary text-primary-foreground rounded-md">
                  Account
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link href="/dashboard/" className="w-11/12 mx-auto px-2 py-3 text-center bg-primary text-primary-foreground rounded-md">
                  Dashboard
                </Link>
              </SheetClose>

              <section className="mt-10 w-11/12 mx-auto">
                <SheetDescription className="text-left text-xl mb-2">
                  Change theme:
                </SheetDescription>
                <section className="h-14">
                  <ThemeSwitcher variant="full" />
                </section>
              </section>
            </section>

            {/* Bottom section with sign out */}
            <section className="w-full mb-6 mt-auto flex items-center">
              <SignOutButton>
                <SheetClose asChild className="cursor-pointer">
                  <Button size={"lg"} variant={"default"} className="w-11/12 mx-auto px-2 py-4 text-center bg-primary text-primary-foreground rounded-md">
                    Sign Out
                    <LogOut className="inline-block ml-2 h-4 w-4" />
                  </Button>
                </SheetClose>
              </SignOutButton>
            </section>
          </section>
        </SheetContent>
      </Sheet>
    </section>
  ) : (
    // non-authenticated users...
    <section className="flex h-full gap-2">
      <ThemeSwitcher variant="icon-only" />
      <Button asChild variant={"default"} size={"default"}>
        <Link className="h-full" href="/sign-in">Get started</Link>
      </Button>
    </section>
  );
}