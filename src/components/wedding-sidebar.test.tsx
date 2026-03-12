import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { WeddingSidebar } from './wedding-sidebar'

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User', avatar_url: null },
    },
    signOut: vi.fn(),
  }),
}))

function renderSidebar() {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <WeddingSidebar />
      </SidebarProvider>
    </MemoryRouter>
  )
}

describe('WeddingSidebar', () => {
  it('renders Wedding Planner link and nav items', () => {
    renderSidebar()

    expect(screen.getByRole('link', { name: /wedding planner/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /planning/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /guests/i })).toBeInTheDocument()
  })

  it('renders Quick Create button', () => {
    renderSidebar()

    expect(screen.getByRole('button', { name: /quick create/i })).toBeInTheDocument()
  })
})
