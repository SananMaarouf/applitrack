"use client";

import { Link } from "@tanstack/react-router";
import { SignedIn, SignedOut, SignOutButton } from "@clerk/clerk-react";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Navbar() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-lg">
            Applitrack
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/" className="hover:underline">
              Home
            </Link>
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

        <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
