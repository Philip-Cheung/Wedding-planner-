import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function InviteLinkPage() {
  const { token } = useParams<{ token: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !token) return
    if (!user) {
      setStatus('idle')
      return
    }

    setStatus('processing')
    const accept = async () => {
      const { data } = await supabase.rpc('accept_share_link_by_token', { p_token: token })
      const result = data as { success: boolean; error?: string } | null
      if (result?.success) {
        setStatus('success')
        navigate('/app', { replace: true })
      } else {
        setStatus('error')
        setError(result?.error === 'invalid_or_expired' ? 'This link has expired or been revoked.' : 'Something went wrong.')
      }
    }

    accept()
  }, [authLoading, user, token, navigate])

  const handleSignIn = () => {
    navigate('/auth', { state: { from: { pathname: `/invite/link/${token}` } }, replace: true })
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Invalid share link.</p>
      </div>
    )
  }

  if (authLoading || status === 'processing') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <p className="text-sm text-muted-foreground">Joining wedding...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <h1 className="text-xl font-semibold">You've been invited to a wedding</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to join and start collaborating on the wedding plan.
          </p>
          <Button onClick={handleSignIn}>Sign in to join</Button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <a href="/app" className="text-sm text-primary underline">Go to app</a>
        </div>
      </div>
    )
  }

  return null
}
