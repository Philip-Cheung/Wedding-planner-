import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
  LayoutDashboardIcon,
  ListTodoIcon,
  UsersIcon,
  MailIcon,
  GlobeIcon,
  Settings2Icon,
  HeartIcon,
  LogOutIcon,
  EllipsisVerticalIcon,
  CirclePlusIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  StoreIcon,
  ImageIcon,
  WalletIcon,
} from 'lucide-react'

const planningSubnav = [
  { title: 'Checklists & Tasks', url: '/app/planning/checklists', icon: ClipboardListIcon },
  { title: 'Guest list', url: '/app/planning/guests', icon: UsersIcon },
  { title: 'Vendor tracker', url: '/app/planning/vendors', icon: StoreIcon },
  { title: 'Vision board', url: '/app/planning/vision-board', icon: ImageIcon },
  { title: 'Budget', url: '/app/planning/budget', icon: WalletIcon },
]

const navMain = [
  { title: 'Dashboard', url: '/app/dashboard', icon: <LayoutDashboardIcon /> },
  { title: 'Planning', subnav: planningSubnav, icon: <ListTodoIcon /> },
  { title: 'Messages', url: '/app/messages', icon: <MailIcon /> },
  { title: 'Website', url: '/app/website', icon: <GlobeIcon /> },
]

const navSecondary = [
  { title: 'Settings', url: '/app/settings', icon: <Settings2Icon /> },
]

export function WeddingSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link to="/app">
                <HeartIcon className="size-5!" />
                <span className="text-base font-semibold">Wedding Planner</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Quick Create"
                      className="min-w-8 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                    >
                      <CirclePlusIcon />
                      <span>Quick Create</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" sideOffset={4}>
                    <DropdownMenuItem onClick={() => navigate('/app/planning/checklists')}>
                      <ListTodoIcon />
                      Add task
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/app/planning/guests')}>
                      <UsersIcon />
                      Add guest
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarMenu>
          {navMain.map((item) => {
            if ('subnav' in item && item.subnav) {
              const isPlanningActive = item.subnav.some(
                (s) => location.pathname === s.url || location.pathname.startsWith(s.url + '/')
              )
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isPlanningActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isPlanningActive}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                        <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.subnav.map((sub) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === sub.url}
                            >
                              <Link to={sub.url}>
                                <sub.icon className="size-4" />
                                <span>{sub.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  isActive={location.pathname.startsWith(item.url)}
                >
                  <Link to={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    isActive={location.pathname.startsWith(item.url)}
                  >
                    <Link to={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="aria-expanded:bg-muted">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.user_metadata?.full_name ?? user?.email ?? 'User'}
                  </span>
                  <span className="truncate text-xs text-foreground/70">{user?.email}</span>
                </div>
                <EllipsisVerticalIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="size-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {user?.user_metadata?.full_name ?? user?.email ?? 'User'}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
