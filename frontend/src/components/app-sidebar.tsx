import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { SignOutButton, useAuth } from '@clerk/clerk-react'
import { BarChart2, ClipboardList, Home, Laptop, LogOut, Moon, Plus, Sun, User } from 'lucide-react'
import { useTheme } from 'next-themes'

import { JobApplicationForm } from '@/components/jobApplicationForm'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)

  if (!userId || isMobile) {
    return null
  }

  const isDashboard = location.pathname === '/dashboard'
  const isCollapsed = state === 'collapsed'
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Laptop

  const goToDashboardSection = (sectionId: 'stats-section' | 'datatable-section') => {
    if (isDashboard) {
      window.history.replaceState(null, '', `#${sectionId}`)
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    navigate({
      to: '/dashboard',
      hash: sectionId,
    })
  }

  return (
    <>
      <Sidebar side="right" collapsible="icon" variant="inset">
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarTrigger className="mx-auto" size={"icon-lg"}  aria-label="Expand sidebar" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="min-h-0 flex-1">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Dashboard overview">
                    <Link to="/dashboard">
                      <Home />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => goToDashboardSection('stats-section')}
                    tooltip="Jump to dashboard stats"
                  >
                    <BarChart2 />
                    <span>Stats</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => goToDashboardSection('datatable-section')}
                    tooltip="Jump to application table"
                  >
                    <ClipboardList />
                    <span>Applications</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Your profile">
                    <Link to={'/my-account' as any}>
                      <User />
                      <span>Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setAddOpen(true)}
                    tooltip="Register application"
                    className="h-12 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 [&>svg]:size-7"
                  >
                    <Plus />
                    <span>Register application</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <div
          className={cn(
            'mt-auto px-2 pb-4',
            isCollapsed ? 'flex flex-col gap-1' : 'space-y-1'
          )}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip="Theme settings">
                    <ThemeIcon />
                    <span>Theme</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side={isCollapsed ? 'left' : 'bottom'}>
                  <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        <SidebarFooter className="border-t border-sidebar-border">
          <SignOutButton redirectUrl="/">
            <SidebarMenuButton tooltip="Sign out" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground">
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