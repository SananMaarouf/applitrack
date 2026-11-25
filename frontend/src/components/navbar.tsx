import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { SignOutButton, useAuth } from "@clerk/clerk-react";
import { BarChart2, ClipboardList, Home, LogOut, Plus, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { JobApplicationForm } from "@/components/jobApplicationForm";
import { cn } from "@/lib/utils";
import { useFirstRunNavigation } from "@/store/dashboardModeStore";

const landingSections = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
] as const;

function AppMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group flex shrink-0 items-center gap-2 text-lg font-bold italic text-foreground transition-colors hover:text-primary"
      aria-label="Applitrack home"
    >
      <span className={compact ? "hidden sm:inline" : "inline"}>Applitrack</span>
      <svg
        className="transition-transform duration-300 group-hover:scale-105"
        width="26"
        height="26"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="40" height="40" rx="9" fill="var(--primary)" />
        <line x1="14" y1="16" x2="34" y2="16" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="24" x2="34" y2="24" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="32" x2="30" y2="32" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </Link>
  );
}

export function Navbar() {
  const { userId } = useAuth();
  const location = useLocation();
  const [addOpen, setAddOpen] = useState(false);

  const isSignedIn = Boolean(userId);
  const isDashboard = location.pathname === "/dashboard";
  const isMyAccountRoute = location.pathname.startsWith("/my-account");
  const activeSection = location.hash.replace(/^#/, "");
  const firstRunMode = useFirstRunNavigation(userId);
  const isFirstRun = isDashboard && firstRunMode;

  useEffect(() => {
    if (isFirstRun) setAddOpen(false);
  }, [isFirstRun]);

  const scrollToSectionIfCurrent = (sectionId: string) => {
    if (location.hash !== `#${sectionId}`) return;
    const element = document.getElementById(sectionId);
    if (!element) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  if (isSignedIn) {
    const bottomItem = (active: boolean) =>
      cn(
        "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-[8px] px-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      );

    return (
      <>
        <header className="w-full border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
            <AppMark />
            <div className="flex items-center gap-2">
              {isMyAccountRoute && (
                <SignOutButton redirectUrl="/">
                  <Button variant="outline" size="sm" className="rounded-[8px]" aria-label="Sign out">
                    <LogOut className="size-4" />
                    <span className="hidden sm:inline">Sign out</span>
                  </Button>
                </SignOutButton>
              )}
              <ThemeSwitcher variant="icon-only" />
            </div>
          </div>
        </header>

        <nav
          aria-label="Primary"
          className="fixed inset-x-3 bottom-[calc(0.75rem_+_env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-stretch gap-1 rounded-2xl border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur md:hidden"
        >
          <Link
            to="/dashboard"
            activeOptions={{ exact: true, includeHash: true }}
            className={bottomItem(isDashboard && !activeSection)}
          >
            <Home className="size-5" />
            <span>Home</span>
          </Link>

          {!isFirstRun && (
            <Link
              to="/dashboard"
              hash="stats-section"
              activeOptions={{ exact: true, includeHash: true }}
              onClick={() => scrollToSectionIfCurrent("stats-section")}
              className={bottomItem(isDashboard && activeSection === "stats-section")}
            >
              <BarChart2 className="size-5" />
              <span>Stats</span>
            </Link>
          )}

          {!isFirstRun && (
            <button
              type="button"
              onClick={() => setAddOpen((prev) => !prev)}
              aria-label={addOpen ? "Close register application" : "Register application"}
              aria-expanded={addOpen}
              className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-[8px] px-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm ring-4 ring-card">
                <Plus className={cn("size-5 transition-transform", addOpen && "rotate-45")} />
              </span>
              <span>Add</span>
            </button>
          )}

          {!isFirstRun && (
            <Link
              to="/dashboard"
              hash="datatable-section"
              activeOptions={{ exact: true, includeHash: true }}
              onClick={() => scrollToSectionIfCurrent("datatable-section")}
              className={bottomItem(isDashboard && activeSection === "datatable-section")}
            >
              <ClipboardList className="size-5" />
              <span>Applications</span>
            </Link>
          )}

          <Link
            to={"/my-account" as any}
            activeOptions={{ exact: true, includeHash: true }}
            className={bottomItem(isMyAccountRoute)}
          >
            <User className="size-5" />
            <span>Profile</span>
          </Link>
        </nav>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent
            showCloseButton={false}
            className="mobile-add-dialog top-auto bottom-[calc(7rem+env(safe-area-inset-bottom))] max-h-[calc(100dvh-8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] translate-y-0 overflow-y-auto p-0 md:top-[50%] md:bottom-auto md:max-h-[90dvh] md:translate-y-[-50%]"
          >
            {userId && <JobApplicationForm user_id={userId} onClose={() => setAddOpen(false)} />}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6">
        <AppMark compact />

        <nav
          aria-label="Landing page"
          className="hidden items-center gap-5 text-sm font-medium text-muted-foreground sm:ml-3 sm:flex"
        >
          {landingSections.map((section) => (
            <Link
              key={section.id}
              to="/"
              hash={section.id}
              activeOptions={{ exact: true, includeHash: true }}
              onClick={() => scrollToSectionIfCurrent(section.id)}
              className="transition-colors hover:text-foreground"
            >
              {section.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeSwitcher variant="icon-only" />
          <Button asChild variant="ghost" size="sm" className="rounded-[8px] px-2.5">
            <Link to="/sign-in">Log in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-[8px] px-3">
            <Link to="/sign-up">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
