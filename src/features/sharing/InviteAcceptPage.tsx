import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'

export function InviteAcceptPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !token) return
    if (!user) {
      navigate('/auth', { state: { from: { pathname: `/invite/accept?token=${token}` } }, replace: true })
      return
    }

    const accept = async () => {
      const { data } = await supabase.rpc('accept_invite_by_token', { p_token: token })
      const result = data as { success: boolean; error?: string } | null
      if (result?.success) {
        setStatus('success')
        navigate('/app', { replace: true })
      } else {
        setStatus('error')
        setError(result?.error === 'invalid_or_expired' ? 'This invite has expired or is invalid.' : 'Something went wrong.')
      }
    }

    accept()
  }, [authLoading, user, token, navigate])

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Invalid invite link.</p>
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
