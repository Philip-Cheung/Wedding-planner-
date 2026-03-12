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

export function WeddingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setWedding(null)
      setLoading(false)
      return
    }

    const { data: weddings } = await supabase
      .from('weddings')
      .select('*')
      .or(`owner_user_id.eq.${user.id},co_planner_user_id.eq.${user.id}`)
      .limit(1)

    setWedding(weddings?.[0] ?? null)
    setLoading(false)
  }, [user?.id])

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
