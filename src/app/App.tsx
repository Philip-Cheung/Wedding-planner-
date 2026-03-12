import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { ConfigRequired } from '@/components/ConfigRequired'
import { isSupabaseConfigured } from '@/lib/supabase'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { AuthPage } from '@/features/auth/AuthPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { WeddingGuard } from '@/features/auth/WeddingGuard'
import { AppShell } from './AppShell'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ChecklistsPage } from '@/features/planning/ChecklistsPage'
import { GuestsPage } from '@/features/guests/GuestsPage'
import { VendorsPage } from '@/features/planning/VendorsPage'
import { VisionBoardPage } from '@/features/planning/VisionBoardPage'
import { BudgetPage } from '@/features/planning/BudgetPage'

function AuthenticatedRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/app" replace />
  return <>{children}</>
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <ConfigRequired />
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/auth"
            element={
              <AuthenticatedRedirect>
                <AuthPage />
              </AuthenticatedRedirect>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <WeddingGuard>
                  <AppShell />
                </WeddingGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="planning" element={<Navigate to="/app/planning/checklists" replace />} />
            <Route path="planning/checklists" element={<ChecklistsPage />} />
            <Route path="planning/guests" element={<GuestsPage />} />
            <Route path="planning/vendors" element={<VendorsPage />} />
            <Route path="planning/vision-board" element={<VisionBoardPage />} />
            <Route path="planning/budget" element={<BudgetPage />} />
            <Route path="guests" element={<Navigate to="/app/planning/guests" replace />} />
            <Route path="messages" element={<div className="p-6">Messages (coming soon)</div>} />
            <Route path="website" element={<div className="p-6">Website (coming soon)</div>} />
            <Route path="settings" element={<div className="p-6">Settings (coming soon)</div>} />
          </Route>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
