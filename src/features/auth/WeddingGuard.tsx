import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { WeddingProvider } from '@/features/wedding/WeddingContext'

/**
 * Redirects to /onboarding if the user has no wedding.
 * Wrap /app routes with this after ProtectedRoute.
 */
export function WeddingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const [hasWedding, setHasWedding] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) return

    const check = async () => {
      const { data } = await supabase
        .from('weddings')
        .select('id')
        .or(`owner_user_id.eq.${user.id},co_planner_user_id.eq.${user.id}`)
        .limit(1)

      setHasWedding((data?.length ?? 0) > 0)
    }

    check()
  }, [user])

  if (hasWedding === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!hasWedding) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />
  }

  return <WeddingProvider>{children}</WeddingProvider>
}
