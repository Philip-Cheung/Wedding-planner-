import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useWedding } from '@/features/wedding/WeddingContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { PlanningChart } from './PlanningChart'
import { PlanningTimeline } from './PlanningTimeline'

export function DashboardPage() {
  const { wedding, loading } = useWedding()
  const navigate = useNavigate()
  const [taskCount, setTaskCount] = useState(0)
  const [guestCount, setGuestCount] = useState(0)
  const [taskTrend, setTaskTrend] = useState<number | null>(null)
  const [guestTrend, setGuestTrend] = useState<number | null>(null)

  useEffect(() => {
    if (!wedding) return

    const now = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const thisWeekStart = new Date(now - weekMs).toISOString()
    const lastWeekStart = new Date(now - 2 * weekMs).toISOString()

    const load = async () => {
      const [
        tasksRes,
        guestsRes,
        tasksThisWeekRes,
        tasksLastWeekRes,
        guestsThisWeekRes,
        guestsLastWeekRes,
      ] = await Promise.all([
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('wedding_id', wedding.id),
        supabase
          .from('guests')
          .select('id', { count: 'exact', head: true })
          .eq('wedding_id', wedding.id),
        supabase
          .from('tasks')
          .select('id')
          .eq('wedding_id', wedding.id)
          .gte('created_at', thisWeekStart)
          .lt('created_at', new Date(now).toISOString()),
        supabase
          .from('tasks')
          .select('id')
          .eq('wedding_id', wedding.id)
          .gte('created_at', lastWeekStart)
          .lt('created_at', thisWeekStart),
        supabase
          .from('guests')
          .select('id')
          .eq('wedding_id', wedding.id)
          .gte('created_at', thisWeekStart)
          .lt('created_at', new Date(now).toISOString()),
        supabase
          .from('guests')
          .select('id')
          .eq('wedding_id', wedding.id)
          .gte('created_at', lastWeekStart)
          .lt('created_at', thisWeekStart),
      ])

      const totalTasks = tasksRes.count ?? 0
      const totalGuests = guestsRes.count ?? 0
      const tasksThisWeek = tasksThisWeekRes.data?.length ?? 0
      const tasksLastWeek = tasksLastWeekRes.data?.length ?? 0
      const guestsThisWeek = guestsThisWeekRes.data?.length ?? 0
      const guestsLastWeek = guestsLastWeekRes.data?.length ?? 0

      setTaskCount(totalTasks)
      setGuestCount(totalGuests)

      const taskPct =
        tasksLastWeek > 0
          ? Math.round(((tasksThisWeek - tasksLastWeek) / tasksLastWeek) * 100)
          : tasksThisWeek > 0
            ? 100
            : null
      const guestPct =
        guestsLastWeek > 0
          ? Math.round(((guestsThisWeek - guestsLastWeek) / guestsLastWeek) * 100)
          : guestsThisWeek > 0
            ? 100
            : null

      setTaskTrend(taskPct)
      setGuestTrend(guestPct)
    }

    load()
  }, [wedding?.id])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-lg lg:col-span-2" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!wedding) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
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

  const daysUntil = wedding.wedding_date
    ? Math.ceil(
        (new Date(wedding.wedding_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const TrendBadge = ({ value }: { value: number | null }) => {
    if (value === null || value === 0) return null
    const isPositive = value > 0
    return (
      <Badge
        variant="secondary"
        className="gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
      >
        {isPositive ? (
          <TrendingUpIcon className="size-3" />
        ) : (
          <TrendingDownIcon className="size-3" />
        )}
        {isPositive ? '+' : ''}
        {value}%
      </Badge>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
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

      <div className="grid grid-cols-1 gap-4 lg:px-0 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Tasks</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {taskCount}
            </CardTitle>
            <CardAction>
              <TrendBadge value={taskTrend} />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 font-medium">
              {taskCount === 0
                ? 'Get started with milestones'
                : 'Milestones and to-dos for your wedding'}
            </div>
            <div className="text-muted-foreground">
              {taskCount === 0
                ? 'Add your first task to begin'
                : 'Track your planning progress'}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigate('/app/planning/checklists')}
            >
              View planning
            </Button>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Guests</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {guestCount}
            </CardTitle>
            <CardAction>
              <TrendBadge value={guestTrend} />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 font-medium">
              {guestCount === 0
                ? 'Build your guest list'
                : wedding.estimated_guest_count
                  ? `Target: ${wedding.estimated_guest_count} guests`
                  : 'Manage invites and RSVPs'}
            </div>
            <div className="text-muted-foreground">
              {guestCount === 0
                ? 'Add guests to get started'
                : 'Invites and RSVPs'}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigate('/app/planning/guests')}
            >
              Manage guests
            </Button>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Status</CardDescription>
            <CardTitle className="text-2xl font-semibold capitalize @[250px]/card:text-3xl">
              {wedding.planning_status.replace('_', ' ')}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 font-medium">
              {wedding.planning_status === 'complete'
                ? 'All set for the big day'
                : 'Keep making progress'}
            </div>
            <div className="text-muted-foreground">
              Current wedding planning phase
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Countdown</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {daysUntil !== null
                ? daysUntil > 0
                  ? `${daysUntil} days`
                  : 'Today!'
                : '—'}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 font-medium">
              {wedding.wedding_date
                ? daysUntil !== null && daysUntil > 0
                  ? 'Until your wedding day'
                  : 'Your wedding is here!'
                : 'Add your wedding date'}
            </div>
            <div className="text-muted-foreground">
              {wedding.wedding_date
                ? format(new Date(wedding.wedding_date), 'MMMM d, yyyy')
                : 'Set date in onboarding'}
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlanningChart weddingId={wedding.id} />
        </div>
        <PlanningTimeline weddingId={wedding.id} />
      </div>
    </div>
  )
}
