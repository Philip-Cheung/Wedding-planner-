import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppShell } from './AppShell'

// Placeholder pages - will be implemented in later phases
function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <p className="text-muted-foreground">Your wedding dashboard</p>
    </div>
  )
}

function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Auth</h2>
        <p className="text-muted-foreground">Sign in / Sign up</p>
      </div>
    </div>
  )
}

function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Onboarding</h2>
        <p className="text-muted-foreground">Set up your wedding</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="planning" element={<div>Planning</div>} />
          <Route path="guests" element={<div>Guests</div>} />
          <Route path="messages" element={<div>Messages</div>} />
          <Route path="website" element={<div>Website</div>} />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
