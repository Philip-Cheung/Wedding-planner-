import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isPast } from 'date-fns'
import { CheckCircle2Icon, CircleIcon, Loader2Icon } from 'lucide-react'

type Task = {
  id: string
  title: string
  status: string
  due_date: string | null
  milestone_id: string | null
}

type Milestone = {
  id: string
  title: string
  sort_order: number
}

type Props = {
  weddingId: string
}

const normalizeStatus = (s: string) => (s === 'todo' ? 'not_started' : s)

function StatusDot({ status }: { status: string }) {
  const s = normalizeStatus(status)
  if (s === 'done') {
    return (
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CheckCircle2Icon className="size-3" />
      </div>
    )
  }
  if (s === 'in_progress') {
    return (
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
        <Loader2Icon className="size-3 animate-spin text-primary" />
      </div>
    )
  }
  return (
    <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-background">
      <CircleIcon className="size-2.5 text-muted-foreground" />
    </div>
  )
}

export function PlanningTimeline({ weddingId }: Props) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [tasksRes, milestonesRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, status, due_date, milestone_id')
          .eq('wedding_id', weddingId)
          .order('due_date', { ascending: true, nullsFirst: false }),
        supabase
          .from('milestones')
          .select('id, title, sort_order')
          .eq('wedding_id', weddingId)
          .order('sort_order'),
      ])

      setTasks(tasksRes.data ?? [])
      setMilestones(milestonesRes.data ?? [])
      setLoading(false)
    }

    load()
  }, [weddingId])

  const milestoneMap = new Map(milestones.map((m) => [m.id, m.title]))

  const tasksWithDates = tasks
    .filter((t) => t.due_date)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 6)

  const tasksWithoutDates = tasks.filter((t) => !t.due_date).slice(0, 2)

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Upcoming tasks</CardTitle>
          <CardDescription>Your planning timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="size-5 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasTasks = tasksWithDates.length > 0 || tasksWithoutDates.length > 0

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Upcoming tasks</CardTitle>
        <CardDescription>Your planning timeline</CardDescription>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-fit"
          onClick={() => navigate('/app/planning/checklists')}
        >
          View all tasks
        </Button>
      </CardHeader>
      <CardContent>
        {!hasTasks ? (
          <p className="text-sm text-muted-foreground">
            No tasks yet. Add tasks in Checklists & Tasks to see them here.
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-0">
              {tasksWithDates.map((task) => {
                const isOverdue =
                  task.due_date &&
                  isPast(new Date(task.due_date)) &&
                  normalizeStatus(task.status) !== 'done'
                const milestoneName = task.milestone_id
                  ? milestoneMap.get(task.milestone_id)
                  : null
                return (
                  <div
                    key={task.id}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    <div className="relative z-10 mt-0.5">
                      <StatusDot status={task.status} />
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      {milestoneName && (
                        <p className="text-xs text-muted-foreground">
                          {milestoneName}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.due_date!), 'MMM d, yyyy')}
                        </span>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {normalizeStatus(task.status).replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
              {tasksWithoutDates.length > 0 && (
                <>
                  {tasksWithDates.length > 0 && (
                    <div className="relative flex gap-4 pt-2 pb-2">
                      <div className="relative z-10 mt-0.5">
                        <div className="size-5 rounded-full border-2 border-dashed border-muted-foreground/30" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        No due date
                      </p>
                    </div>
                  )}
                  {tasksWithoutDates.map((task) => (
                    <div
                      key={task.id}
                      className="relative flex gap-4 pb-6 last:pb-0 pt-1"
                    >
                      <div className="relative z-10 mt-0.5">
                        <StatusDot status={task.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{task.title}</p>
                        {task.milestone_id && (
                          <p className="text-xs text-muted-foreground">
                            {milestoneMap.get(task.milestone_id)}
                          </p>
                        )}
                        <Badge
                          variant="secondary"
                          className="mt-1 text-xs capitalize"
                        >
                          {normalizeStatus(task.status).replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
