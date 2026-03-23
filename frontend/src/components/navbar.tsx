import { useState } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  useAuth,
} from "@clerk/clerk-react";
import { BarChart2, ClipboardList, Home, Plus, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { JobApplicationForm } from "@/components/jobApplicationForm";

function AppMark() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2 text-xl font-bold italic transition-all duration-300 hover:gap-3"
    >
      <span className="md:hidden">AT</span>
      <span className="hidden md:inline">Applitrack</span>
      <svg
        className="transition-transform duration-300 group-hover:scale-110"
        width="28"
        height="28"
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
  const navigate = useNavigate();
  const location = useLocation();
  const [addOpen, setAddOpen] = useState(false);
  const isSignedIn = Boolean(userId);

  const scrollToSection = (id: string) => {
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (location.pathname === '/dashboard') {
      window.history.replaceState(null, '', `#${id}`);
      scroll();
    } else {
      navigate({ to: '/dashboard', hash: id });
    }
  };

  if (isSignedIn) {
    return (
      <>
        <header className="w-full px-4 pt-4">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-xl px-4 py-4 ">
            <AppMark />
            <div className="md:hidden">
              <ThemeSwitcher variant="icon-only" />
            </div>
          </div>
        </header>

        <nav className="fixed right-0 bottom-0 left-0 z-50 mx-4 flex h-16 items-end justify-around rounded-xl bg-primary px-2 md:hidden">
          <Link
            to="/dashboard"
            activeProps={{ className: "flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-primary-foreground" }}
            inactiveProps={{ className: "flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-primary-foreground/50 transition-colors hover:text-primary-foreground" }}
          >
            <Home className="size-5" />
            <span className="text-xs">Home</span>
          </Link>

          <button
            onClick={() => scrollToSection('stats-section')}
            className="flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-primary-foreground/50 transition-colors hover:text-primary-foreground"
          >
            <BarChart2 className="size-5" />
            <span className="text-xs">Stats</span>
          </button>

          <div className="flex flex-col text-primary-foreground">
            <button
              onClick={() => setAddOpen((prev) => !prev)}
              className="z-50 flex h-full flex-1 cursor-pointer flex-col items-center justify-center text-primary-foreground/50 transition-all duration-500 hover:scale-110 hover:text-primary-foreground"
              aria-label={addOpen ? "Close" : "Add job application"}
            >
              <div className="z-50 -translate-y-3 rounded-full bg-primary-foreground p-2.5 text-primary shadow-lg ring-4 ring-primary">
                {addOpen ? <X className="size-5" /> : <Plus className="size-5" />}
              </div>
            </button>
            <span className="self-center text-xs">Add</span>
          </div>

          <button
            onClick={() => scrollToSection('datatable-section')}
            className="flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-primary-foreground/50 transition-colors hover:text-primary-foreground"
          >
            <ClipboardList className="size-5" />
            <span className="text-xs">Edit</span>
          </button>

          <Link
            to={'/my-account' as any}
            activeProps={{ className: "flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-primary-foreground" }}
            inactiveProps={{ className: "flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-primary-foreground/50 transition-colors hover:text-primary-foreground" }}
          >
            <User className="size-5" />
            <span className="text-xs">Profile</span>
          </Link>
        </nav>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto p-0">
            {userId && <JobApplicationForm user_id={userId} />}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <header className="flex w-full px-4 pt-2">
      <div className="mx-auto mt-2 flex w-full max-w-7xl items-center justify-between rounded-lg px-6 py-5">
        <div className="flex items-center">
          <AppMark />
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <ThemeSwitcher variant="icon-only" />
          <Button variant="default" asChild>
            <Link to="/sign-in">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
