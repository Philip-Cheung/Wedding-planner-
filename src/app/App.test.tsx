import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('@/features/auth/AuthContext', () => {
  const AuthContext = React.createContext<{
    user: { id: string; email: string; user_metadata: object } | null
    loading: boolean
    signOut: () => Promise<void>
    session: unknown
  } | null>(null)
  const value = {
    user: { id: '1', email: 'test@example.com', user_metadata: {} },
    loading: false,
    signOut: vi.fn(),
    session: null,
  }
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthContext.Provider, { value }, children),
    useAuth: () => {
      const ctx = React.useContext(AuthContext)
      if (!ctx) throw new Error('useAuth must be used within AuthProvider')
      return ctx
    },
  }
})

vi.mock('@/features/auth/WeddingGuard', () => ({
  WeddingGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/features/wedding/WeddingContext', () => ({
  WeddingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useWedding: () => ({
    wedding: {
      id: '1',
      wedding_name: 'Test Wedding',
      partner_name: 'Partner',
      wedding_date: '2026-06-10',
      location_city: 'NYC',
      estimated_guest_count: 80,
      planning_status: 'draft',
    },
    loading: false,
    refresh: vi.fn(),
  }),
}))

describe('App', () => {
  it('renders dashboard when navigating to /app', async () => {
    render(<App />)
    const headings = await screen.findAllByRole('heading', { name: /test wedding/i })
    expect(headings.length).toBeGreaterThan(0)
  })
})
