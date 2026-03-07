import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { SignedIn, SignedOut, SignOutButton } from "@clerk/clerk-react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full px-4 flex">
      <div className="bg-primary flex mx-auto w-full 
      max-w-7xl items-center justify-between rounded-b-lg px-6 py-5">
        <div className="
        flex items-center ">
          <Link to="/" className="
          gap-2 hover:gap-4 group transition-all duration-300 
          font-bold text-primary-foreground text-2xl flex items-center">
            Applitrack
            <svg className="group-hover:scale-110 transition-transform duration-300" width="28" height="28" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="4" y="4" width="40" height="40" rx="9"
                    fill="var(--primary-foreground)" />
              <line x1="14" y1="16" x2="34" y2="16"
                    stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"/>
              <line x1="14" y1="24" x2="34" y2="24"
                    stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"/>
              <line x1="14" y1="32" x2="30" y2="32"
                    stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <SignedIn>
              <Button variant={"secondary"} asChild>
                <Link to="/dashboard">
                  Dashboard
                </Link>
              </Button>
              <Button variant={"secondary"} asChild>
                <Link to={'/my-account' as any}>
                  Profile
                </Link>
              </Button>
            </SignedIn>
          </nav>
          
          <ThemeSwitcher variant="icon-only" />
          <SignedOut>
            <Button variant={"secondary"} asChild>
              <Link to="/sign-in">Get started</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <SignOutButton redirectUrl="/">
              <Button variant="destructive">Sign out</Button>
            </SignOutButton>
          </SignedIn>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <SignedOut>
            <div className="flex gap-2">
              <ThemeSwitcher variant="icon-only" />
              <Button asChild>
                <Link to="/sign-in">Get started</Link>
              </Button>
            </div>
          </SignedOut>
          <SignedIn>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size={"icon-lg"}>
                  <Menu className="size-8" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="px-2 text-2xl flex flex-col">
                <SheetHeader />
                <div className="flex flex-col gap-4 mt-6">
                  <Link to="/dashboard" className="hover:underline" onClick={() => setOpen(false)}>
                    Dashboard
                  </Link>
                  <SignedIn>
                    <Link to={'/my-account'} className="hover:underline" onClick={() => setOpen(false)}>
                      Profile
                    </Link>
                  </SignedIn>
                  <div className="mt-4">
                    <p className="mb-1 text-sm ">Theme: </p>
                    <ThemeSwitcher variant="dropdown-menu" />
                  </div>
                </div>
                <div className="mt-auto mb-4 flex flex-col gap-4">
                  <SignedIn>
                    <SignOutButton redirectUrl="/">
                      <Button variant="destructive" onClick={() => setOpen(false)}>
                        Sign out
                      </Button>
                    </SignOutButton>
                  </SignedIn>
                </div>
              </SheetContent>
            </Sheet>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
