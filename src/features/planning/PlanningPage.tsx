import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'

type Milestone = {
  id: string
  title: string
  description: string | null
  sort_order: number
}

type Task = {
  id: string
  milestone_id: string | null
  title: string
  description: string | null
  status: string
  due_date: string | null
  sort_order: number
}

export function PlanningPage() {
  const { user } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newMilestone, setNewMilestone] = useState('')
  const [newTask, setNewTask] = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [addingTask, setAddingTask] = useState(false)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data: weddings } = await supabase
        .from('weddings')
        .select('id')
        .or(`owner_user_id.eq.${user.id},co_planner_user_id.eq.${user.id}`)
        .limit(1)

      const w = weddings?.[0]
      if (!w) {
        setLoading(false)
        return
      }

      setWeddingId(w.id)

      const [milestonesRes, tasksRes] = await Promise.all([
        supabase.from('milestones').select('*').eq('wedding_id', w.id).order('sort_order'),
        supabase.from('tasks').select('*').eq('wedding_id', w.id).order('sort_order'),
      ])

      setMilestones(milestonesRes.data ?? [])
      setTasks(tasksRes.data ?? [])
      setLoading(false)
    }

    load()
  }, [user])

  const addMilestone = async () => {
    if (!weddingId || !newMilestone.trim()) return
    setAddingMilestone(true)
    const { data } = await supabase
      .from('milestones')
      .insert({
        wedding_id: weddingId,
        title: newMilestone.trim(),
        sort_order: milestones.length,
      })
      .select()
      .single()
    if (data) {
      setMilestones((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order))
      setNewMilestone('')
    }
    setAddingMilestone(false)
  }

  const addTask = async () => {
    if (!weddingId || !newTask.trim()) return
    setAddingTask(true)
    const { data } = await supabase
      .from('tasks')
      .insert({
        wedding_id: weddingId,
        title: newTask.trim(),
        sort_order: tasks.length,
      })
      .select()
      .single()
    if (data) {
      setTasks((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order))
      setNewTask('')
    }
    setAddingTask(false)
  }

  const toggleTaskStatus = async (task: Task) => {
    const next =
      task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done'
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t))
    )
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (!weddingId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No wedding found. Complete onboarding first.</p>
      </div>
    )
  }

  const tasksByMilestone = milestones.map((m) => ({
    milestone: m,
    tasks: tasks.filter((t) => t.milestone_id === m.id),
  }))
  const unassignedTasks = tasks.filter((t) => !t.milestone_id)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Planning</h2>
        <p className="text-muted-foreground">Milestones and tasks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add milestone</CardTitle>
          <CardDescription>Group tasks by phase (e.g. Venue, Catering)</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="e.g. Book venue"
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
          />
          <Button onClick={addMilestone} disabled={addingMilestone || !newMilestone.trim()}>
            Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add task</CardTitle>
          <CardDescription>Standalone tasks (or assign to a milestone later)</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="e.g. Send save-the-dates"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <Button onClick={addTask} disabled={addingTask || !newTask.trim()}>
            Add
          </Button>
        </CardContent>
      </Card>

      {unassignedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Unassigned</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {unassignedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(task)}
                  className="shrink-0 size-5 rounded border flex items-center justify-center text-xs"
                >
                  {task.status === 'done' ? '✓' : ''}
                </button>
                <span
                  className={
                    task.status === 'done' ? 'line-through text-muted-foreground' : ''
                  }
                >
                  {task.title}
                </span>
                {task.due_date && (
                  <span className="text-sm text-muted-foreground ml-auto">
                    {format(new Date(task.due_date), 'MMM d')}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tasksByMilestone.map(({ milestone, tasks: msTasks }) => (
        <Card key={milestone.id}>
          <CardHeader>
            <CardTitle>{milestone.title}</CardTitle>
            {milestone.description && (
              <CardDescription>{milestone.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {msTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            ) : (
              msTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <button
                    type="button"
                    onClick={() => toggleTaskStatus(task)}
                    className="shrink-0 size-5 rounded border flex items-center justify-center text-xs"
                  >
                    {task.status === 'done' ? '✓' : ''}
                  </button>
                  <span
                    className={
                      task.status === 'done' ? 'line-through text-muted-foreground' : ''
                    }
                  >
                    {task.title}
                  </span>
                  {task.due_date && (
                    <span className="text-sm text-muted-foreground ml-auto">
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
