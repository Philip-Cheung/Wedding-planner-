import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { format } from 'date-fns'

type Wedding = {
  id: string
  wedding_name: string | null
  partner_name: string | null
  wedding_date: string | null
  location_city: string | null
  estimated_guest_count: number | null
  planning_status: string
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [taskCount, setTaskCount] = useState(0)
  const [guestCount, setGuestCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data: weddings } = await supabase
        .from('weddings')
        .select('*')
        .or(`owner_user_id.eq.${user.id},co_planner_user_id.eq.${user.id}`)
        .limit(1)

      const w = weddings?.[0]
      if (!w) {
        setLoading(false)
        return
      }

      setWedding(w)

      const [tasksRes, guestsRes] = await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('wedding_id', w.id),
        supabase.from('guests').select('id', { count: 'exact', head: true }).eq('wedding_id', w.id),
      ])

      setTaskCount(tasksRes.count ?? 0)
      setGuestCount(guestsRes.count ?? 0)
      setLoading(false)
    }

    load()
  }, [user])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!wedding) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>No wedding yet</CardTitle>
            <CardDescription>Create your wedding to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/onboarding')}>
              Set up wedding
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {wedding.wedding_name || 'Your Wedding'}
        </h2>
        <p className="text-muted-foreground">
          {wedding.partner_name && `with ${wedding.partner_name}`}
          {wedding.wedding_date &&
            ` • ${format(new Date(wedding.wedding_date), 'MMMM d, yyyy')}`}
          {wedding.location_city && ` • ${wedding.location_city}`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasks</CardDescription>
            <CardTitle className="text-3xl">{taskCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/planning')}>
              View planning
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Guests</CardDescription>
            <CardTitle className="text-3xl">{guestCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/guests')}>
              Manage guests
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle className="text-lg capitalize">
              {wedding.planning_status.replace('_', ' ')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
