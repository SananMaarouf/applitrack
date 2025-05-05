import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Settings } from "lucide-react";
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

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <div className="flex h-full gap-2">
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
    </div>
  ) : (
    <div className="flex h-full gap-2">
      <ThemeSwitcher />
      <Button asChild variant={"default"} size={"fill"}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild variant={"default"} size={"fill"}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
