import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SignOutButton, useAuth } from '@clerk/clerk-react'
import { BarChart2, ClipboardList, Home, LogOut, Moon, Plus, Sun, User } from 'lucide-react'

import { JobApplicationForm } from '@/components/jobApplicationForm'
import { useFirstRunNavigation } from '@/store/dashboardModeStore'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useThemeToggle } from '@/components/theme-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const { userId } = useAuth()
  const { state, isMobile } = useSidebar()
  const { isDark, toggleTheme } = useThemeToggle()
  const location = useLocation()
  const [addOpen, setAddOpen] = useState(false)
  const firstRunMode = useFirstRunNavigation(userId)
  const isFirstRun = location.pathname === '/dashboard' && firstRunMode

  useEffect(() => {
    if (isFirstRun) setAddOpen(false)
  }, [isFirstRun])

  if (!userId || isMobile) {
    return null
  }

  const isDashboard = location.pathname === '/dashboard'
  const activeSection = location.hash.replace(/^#/, '')
  const isCollapsed = state === 'collapsed'
  const ThemeIcon = isDark ? Moon : Sun
  const nextThemeLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  const scrollToSectionIfCurrent = (sectionId: string) => {
    if (!isDashboard || activeSection !== sectionId) return
    const element = document.getElementById(sectionId)
    if (!element) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <>
      <Sidebar side="left" collapsible="icon" variant="inset">
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarTrigger
                className="mx-auto"
                size={"icon-lg"}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="min-h-0 flex-1">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Dashboard overview"
                    isActive={isDashboard && !activeSection}
                  >
                    <Link
                      to="/dashboard"
                      activeOptions={{ exact: true, includeHash: true }}
                      aria-label="Dashboard"
                    >
                      <Home />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {!isFirstRun && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip="Jump to dashboard stats"
                        isActive={isDashboard && activeSection === 'stats-section'}
                      >
                        <Link
                          to="/dashboard"
                          hash="stats-section"
                          activeOptions={{ exact: true, includeHash: true }}
                          onClick={() => scrollToSectionIfCurrent('stats-section')}
                          aria-label="Stats"
                        >
                          <BarChart2 />
                          <span>Stats</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip="Jump to application table"
                        isActive={isDashboard && activeSection === 'datatable-section'}
                      >
                        <Link
                          to="/dashboard"
                          hash="datatable-section"
                          activeOptions={{ exact: true, includeHash: true }}
                          onClick={() => scrollToSectionIfCurrent('datatable-section')}
                          aria-label="Applications"
                        >
                          <ClipboardList />
                          <span>Applications</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Your profile"
                    isActive={location.pathname.startsWith('/my-account')}
                  >
                    <Link
                      to={'/my-account' as any}
                      activeOptions={{ exact: true, includeHash: true }}
                      aria-label="Profile"
                    >
                      <User />
                      <span>Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {!isFirstRun && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setAddOpen(true)}
                      tooltip="Register application"
                      aria-label="Register application"
                      className="h-12 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 [&>svg]:size-7"
                    >
                      <Plus />
                      <span>Register application</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <div
          className={cn(
            'mt-auto px-2 pb-4',
            isCollapsed ? 'flex flex-col gap-1' : 'space-y-1'
          )}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleTheme}
                tooltip={nextThemeLabel}
                aria-label={nextThemeLabel}
              >
                <ThemeIcon />
                <span>Theme</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        <SidebarFooter className="border-t border-sidebar-border">
          <SignOutButton redirectUrl="/">
            <SidebarMenuButton tooltip="Sign out" aria-label="Sign out" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SignOutButton>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto p-0">
          {userId && <JobApplicationForm user_id={userId} onClose={() => setAddOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}