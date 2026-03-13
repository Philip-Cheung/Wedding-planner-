import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'

export type Wedding = {
  id: string
  wedding_name: string | null
  partner_name: string | null
  wedding_date: string | null
  location_city: string | null
  estimated_guest_count: number | null
  planning_status: string
}

type WeddingContextValue = {
  wedding: Wedding | null
  loading: boolean
  refresh: () => Promise<void>
}

const WeddingContext = createContext<WeddingContextValue | null>(null)

type WeddingProviderProps = { children: ReactNode; initialWeddingId?: string; initialWedding?: Wedding | null }

export function WeddingProvider({ children, initialWeddingId, initialWedding }: WeddingProviderProps) {
  const { user } = useAuth()
  const getInitialWedding = (): Wedding | null => {
    if (initialWedding?.id) return initialWedding
    try {
      const stored = sessionStorage.getItem('wedding_just_created')
      if (stored) return JSON.parse(stored) as Wedding
    } catch {
      /* ignore */
    }
    return null
  }
  const [wedding, setWedding] = useState<Wedding | null>(getInitialWedding)
  const [loading, setLoading] = useState(!getInitialWedding())

  const load = useCallback(async () => {
    if (!user) {
      const fromStorage = getInitialWedding()
      if (!fromStorage) {
        setWedding(null)
      }
      setLoading(false)
      return
    }

    let weddingToUse = initialWedding
    if (!weddingToUse) {
      try {
        const stored = sessionStorage.getItem('wedding_just_created')
        if (stored) {
          weddingToUse = JSON.parse(stored) as Wedding
        }
      } catch {
        /* ignore */
      }
    }

    if (weddingToUse && weddingToUse.id) {
      setWedding(weddingToUse)
      setLoading(false)
      // Do not clear sessionStorage here; clear only after we've confirmed from the backend (below)
      // so a refresh shortly after onboarding can still recover the wedding from storage.
      return
    }

    if (initialWeddingId) {
      const { data } = await supabase.from('weddings').select('*').eq('id', initialWeddingId).single()
      if (data) {
        setWedding(data as Wedding)
        setLoading(false)
        try {
          sessionStorage.removeItem('wedding_just_created')
        } catch {
          /* ignore */
        }
        return
      }
    }

    const { data: weddings } = await supabase.rpc('get_primary_wedding_for_user', {
      p_user_id: user.id,
    })

    const fetched = Array.isArray(weddings) && weddings[0] ? weddings[0] : null
    if (fetched) {
      setWedding(fetched)
      try {
        sessionStorage.removeItem('wedding_just_created')
      } catch {
        /* ignore */
      }
    } else {
      const fromStorage = getInitialWedding()
      if (!fromStorage) {
        setWedding(null)
      }
    }
    setLoading(false)
  }, [user?.id, initialWeddingId, initialWedding])

  useEffect(() => {
    load()
  }, [load])

  return (
    <WeddingContext.Provider value={{ wedding, loading, refresh: load }}>
      {children}
    </WeddingContext.Provider>
  )
}

export function useWedding() {
  const ctx = useContext(WeddingContext)
  if (!ctx) throw new Error('useWedding must be used within WeddingProvider')
  return ctx
}
