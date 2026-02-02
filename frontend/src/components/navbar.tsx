"use client";

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
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-lg">
            Applitrack
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3 text-sm">
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <SignedIn>
              <Link to={'/my-account' as any} className="hover:underline">
                My account
              </Link>
            </SignedIn>
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeSwitcher />

          <SignedOut>
            <Button asChild>
              <Link to="/sign-in">Get started</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <SignOutButton redirectUrl="/">
              <Button variant="outline">Sign out</Button>
            </SignOutButton>
          </SignedIn>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Link
                  to="/dashboard"
                  className="text-sm hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <SignedIn>
                  <Link
                    to={'/my-account' as any}
                    className="text-sm hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    My account
                  </Link>
                </SignedIn>
                <div className="border-t pt-4 flex flex-col gap-4">
                  <ThemeSwitcher />
                  <SignedOut>
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link to="/sign-in">Get started</Link>
                    </Button>
                  </SignedOut>
                  <SignedIn>
                    <SignOutButton redirectUrl="/">
                      <Button variant="outline" onClick={() => setOpen(false)}>
                        Sign out
                      </Button>
                    </SignOutButton>
                  </SignedIn>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
