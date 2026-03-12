import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/planning', label: 'Planning' },
  { to: '/app/guests', label: 'Guests' },
  { to: '/app/messages', label: 'Messages' },
  { to: '/app/website', label: 'Website' },
  { to: '/app/settings', label: 'Settings' },
]

export function AppShell() {
  const location = useLocation()
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-border flex flex-col">
        <header className="p-4 border-b border-border">
          <Link to="/app" className="text-xl font-semibold">Wedding Planner</Link>
        </header>
        <nav className="flex-1 p-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith(item.to)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
