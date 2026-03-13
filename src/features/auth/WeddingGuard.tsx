import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from './AuthContext'
import { WeddingProvider, type Wedding } from '@/features/wedding/WeddingContext'

/**
 * Redirects to /onboarding if the user has no wedding.
 * Wrap /app routes with this after ProtectedRoute.
 */
export function WeddingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const [hasWedding, setHasWedding] = useState<boolean | null>(null)

  const fromSuccess = location.state && typeof location.state === 'object' && 'fromOnboardingSuccess' in location.state
  const hasJustCreated = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('wedding_just_created')

  useEffect(() => {
    if (fromSuccess || hasJustCreated) {
      setHasWedding(true)
      return
    }
    if (!user) return

    const check = async () => {
      const { data, error } = await supabase.rpc('get_primary_wedding_for_user', {
        p_user_id: user.id,
      })
      if (error) {
        setHasWedding((prev) => (prev === true ? true : false))
        return
      }
      const hasResult = Array.isArray(data) && data.length > 0
      setHasWedding((prev) => (hasResult ? true : (prev === true ? true : false)))
    }

    check()
  }, [user?.id, fromSuccess, hasJustCreated])

  if (hasWedding === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    )
  }

  if (!hasWedding) {
    const fromCancel = location.state && typeof location.state === 'object' && 'fromOnboardingCancel' in location.state
    const state = location.state && typeof location.state === 'object' ? (location.state as { weddingId?: string; wedding?: Wedding }) : {}
    let weddingId = state.weddingId
    let initialWedding: Wedding | undefined = state.wedding
    if (!initialWedding && hasJustCreated) {
      try {
        const stored = sessionStorage.getItem('wedding_just_created')
        if (stored) {
          initialWedding = JSON.parse(stored) as Wedding
          weddingId = (initialWedding as { id?: string })?.id
        }
      } catch {
        /* ignore */
      }
    }
    if (fromSuccess || hasJustCreated) {
      return <WeddingProvider initialWeddingId={weddingId} initialWedding={initialWedding}>{children}</WeddingProvider>
    }
    if (fromCancel) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-sm">
            <h1 className="text-xl font-semibold">Create your wedding</h1>
            <p className="text-muted-foreground text-sm">
              Set up your wedding plan to get started.
            </p>
            <Button asChild>
              <Link to="/onboarding">Set up wedding</Link>
            </Button>
          </div>
        </div>
      )
    }
    return <Navigate to="/onboarding" state={{ from: location }} replace />
  }

  // Pass wedding from sessionStorage when we just created it so the provider has it even before load()
  if (hasJustCreated) {
    try {
      const stored = sessionStorage.getItem('wedding_just_created')
      if (stored) {
        const initialWedding = JSON.parse(stored) as Wedding
        const weddingId = (initialWedding as { id?: string })?.id
        if (weddingId) {
          return (
            <WeddingProvider initialWeddingId={weddingId} initialWedding={initialWedding}>
              {children}
            </WeddingProvider>
          )
        }
      }
    } catch {
      /* ignore */
    }
  }

  return <WeddingProvider>{children}</WeddingProvider>
}
