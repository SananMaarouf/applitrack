import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Settings, SettingsIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function AuthButton() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      <ThemeSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant={"switch"} size={"default"} className="hover:text-card-foreground">
            <Settings className="w-6 h-6 " />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card text-card-foreground">
          <DropdownMenuLabel className="font-bold">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
            <Link href="/dashboard/settings"className="w-full flex px-2 py-1.5 text-sm rounded-md text-left hover:bg-hover hover:text-card-foreground">
              Settings
            </Link>
          <DropdownMenuSeparator />
            <form action={signOutAction} className="">
              <button type="submit" className="w-full  px-2 py-1.5 text-sm rounded-md text-left hover:bg-hover hover:text-card-foreground">
                Sign out
              </button>
            </form>
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  ) : (
    <div className="flex gap-2">
      <ThemeSwitcher />
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
