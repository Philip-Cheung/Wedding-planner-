import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { AuthPage } from '@/features/auth/AuthPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { WeddingGuard } from '@/features/auth/WeddingGuard'
import { AppShell } from './AppShell'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PlanningPage } from '@/features/planning/PlanningPage'
import { GuestsPage } from '@/features/guests/GuestsPage'

function AuthenticatedRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/app" replace />
  return <>{children}</>
}

export default function App() {
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
            <Route path="planning" element={<PlanningPage />} />
            <Route path="guests" element={<GuestsPage />} />
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
