import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { WeddingSidebar } from '@/components/wedding-sidebar'
import { SiteHeader } from '@/components/site-header'

export function AppShell() {
  return (
    <SidebarProvider>
      <WeddingSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col overflow-auto @container/main">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
