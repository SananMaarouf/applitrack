import { useState } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignOutButton,
  useAuth,
  useClerk,
} from "@clerk/clerk-react";
import { Home, BarChart2, Plus, X, ClipboardList, User, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobApplicationForm } from "@/components/jobApplicationForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();
  const isOnMyAccount = location.pathname.startsWith('/my-account');
  const [addOpen, setAddOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (location.pathname === '/dashboard') {
      scroll();
    } else {
      navigate({ to: '/dashboard' }).then(() => setTimeout(scroll, 100));
    }
  };

  return (
    <>
      <header className="w-full px-4 flex">
      <div className="
        bg-primary flex mx-auto w-full max-w-7xl mt-2
        items-center justify-between shadow-xl rounded-lg px-6 py-5"
      >
        
        <div className="flex items-center ">
          <Link to="/" className="
          gap-2 hover:gap-4 group transition-all duration-300 
          font-bold italic text-primary-foreground text-2xl flex items-center">
            <span className="md:hidden">AT</span>
            <span className="hidden md:inline">Applitrack</span>
            <svg 
              className="group-hover:scale-110 transition-transform duration-300" 
              width="28" height="28" 
              viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
            >
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
          <ClerkLoaded>
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
          </ClerkLoaded>
          
          <ThemeSwitcher variant="icon-only" />
          <ClerkLoading>
            <Button variant={"secondary"} asChild>
              <Link to="/sign-in">Get started</Link>
            </Button>
          </ClerkLoading>

          <ClerkLoaded>
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
          </ClerkLoaded>
        </div>

        {/* Mobile: show theme + sign-in when signed out, theme only when signed in */}
        <div className="md:hidden">
          <ClerkLoading>
            <ThemeSwitcher variant="icon-only" />
          </ClerkLoading>
          <ClerkLoaded>
            <SignedOut>
              <div className="flex gap-2">
                <ThemeSwitcher variant="icon-only" />
                <Button variant="secondary" asChild>
                  <Link to="/sign-in">Get started</Link>
                </Button>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex gap-2">
                <ThemeSwitcher variant="icon-only" />
                {isOnMyAccount && (
                  <SignOutButton redirectUrl="/">
                    <Button variant="destructive">
                      <LogOut className="size-4" />
                      Sign out
                    </Button>
                  </SignOutButton>
                )}
              </div>
            </SignedIn>
          </ClerkLoaded>
        </div>
      </div>
    </header>

    {/* Mobile Bottom Navigation */}
    <ClerkLoaded>
      <SignedIn>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary shadow-[0_-2px_12px_rgba(0,0,0,0.2)] flex items-end justify-around px-2 h-16">
          <Link
            to="/dashboard"
            activeProps={{ className: "flex flex-col items-center justify-center gap-0.5 h-full flex-1 text-primary-foreground" }}
            inactiveProps={{ className: "flex flex-col items-center justify-center gap-0.5 h-full flex-1 text-primary-foreground/50 hover:text-primary-foreground transition-colors" }}
          >
            <Home className="size-5" />
            <span className="text-xs">Home</span>
          </Link>

          <button
            onClick={() => scrollToSection('stats-section')}
            className="flex flex-col items-center justify-center gap-0.5 h-full flex-1 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
          >
            <BarChart2 className="size-5" />
            <span className="text-xs">Stats</span>
          </button>

          <button
            onClick={() => setAddOpen((prev) => !prev)}
            className="flex flex-col items-center cursor-pointer hover:scale-110 transition-all duration-600 z-50 justify-center h-full flex-1 text-primary-foreground/50 hover:text-primary-foreground"
            aria-label={addOpen ? "Close" : "Add job application"}
          >
            <div className="bg-primary-foreground z-50 text-primary rounded-full p-2.5 -translate-y-3 shadow-lg ring-4 ring-primary">
              {addOpen ? <X className="size-5 z-50" /> : <Plus className="size-5" />}
            </div>
          </button>

          <button
            onClick={() => scrollToSection('datatable-section')}
            className="flex flex-col items-center justify-center gap-0.5 h-full flex-1 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
          >
            <ClipboardList className="size-5" />
            <span className="text-xs">Edit</span>
          </button>

          <Link
            to={'/my-account' as any}
            activeProps={{ className: "flex flex-col items-center justify-center gap-0.5 h-full flex-1 text-primary-foreground" }}
            inactiveProps={{ className: "flex flex-col items-center justify-center gap-0.5 h-full flex-1 text-primary-foreground/50 hover:text-primary-foreground transition-colors" }}
          >
            <User className="size-5" />
            <span className="text-xs">Profile</span>
          </Link>
        </nav>

        {/* New Application Modal */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto p-0">
            {userId && <JobApplicationForm user_id={userId} />}
          </DialogContent>
        </Dialog>
      </SignedIn>
    </ClerkLoaded>
    </>
  );
}
