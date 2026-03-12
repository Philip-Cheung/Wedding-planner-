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
import { format } from 'date-fns'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const KANBAN_COLUMNS = [
  { id: 'not_started', label: 'Not started' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
] as const

type TaskStatus = (typeof KANBAN_COLUMNS)[number]['id']

type Task = {
  id: string
  milestone_id: string | null
  title: string
  description: string | null
  status: string
  due_date: string | null
  start_date: string | null
  sort_order: number
}

function TaskCard({
  task,
  onDelete,
}: {
  task: Task
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const style = transform
    ? { transform: CSS.Transform.toString(transform), transition }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg border bg-card p-3 shadow-sm ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{task.title}</p>
          {task.due_date && (
            <p className="text-xs text-muted-foreground mt-1">
              Due {format(new Date(task.due_date), 'MMM d')}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function KanbanColumn({
  column,
  tasks,
  onDelete,
}: {
  column: (typeof KANBAN_COLUMNS)[number]
  tasks: Task[]
  onDelete: (id: string) => void
}) {
  const taskIds = tasks.map((t) => t.id)
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[240px] flex-col rounded-lg border bg-muted/30 p-3 transition-colors ${isOver ? 'ring-2 ring-primary/50' : ''}`}
    >
      <h3 className="mb-3 font-medium text-sm">{column.label}</h3>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function ChecklistsPage() {
  const { user } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
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

      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('wedding_id', w.id)
        .order('sort_order')

      setTasks(data ?? [])
      setLoading(false)
    }

    load()
  }, [user])

  const normalizeStatus = (s: string): TaskStatus =>
    s === 'todo' ? 'not_started' : (s as TaskStatus)

  const tasksByColumn = KANBAN_COLUMNS.reduce(
    (acc, col) => ({
      ...acc,
      [col.id]: tasks.filter((t) => normalizeStatus(t.status) === col.id),
    }),
    {} as Record<TaskStatus, Task[]>
  )

  const addTask = async () => {
    if (!weddingId || !newTask.trim()) return
    setAddingTask(true)
    const { data } = await supabase
      .from('tasks')
      .insert({
        wedding_id: weddingId,
        title: newTask.trim(),
        status: 'not_started',
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

  const updateTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    )
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const task = tasks.find((t) => t.id === active.id)
    if (!task) return
    const overId = String(over.id)
    let targetCol = KANBAN_COLUMNS.find((c) => c.id === overId)
    if (!targetCol) {
      targetCol = KANBAN_COLUMNS.find((c) =>
        tasksByColumn[c.id].some((t) => t.id === overId)
      )
    }
    if (targetCol && targetCol.id !== normalizeStatus(task.status)) {
      await updateTaskStatus(task, targetCol.id)
    }
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const upcomingTasks = tasks
    .filter((t) => t.due_date && normalizeStatus(t.status) !== 'done')
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 10)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Checklists & Tasks</h2>
          <p className="text-muted-foreground">Kanban board and upcoming appointments</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="w-48"
          />
          <Button onClick={addTask} disabled={addingTask || !newTask.trim()}>
            Add
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {KANBAN_COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={tasksByColumn[col.id]}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          </DndContext>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Tasks with due dates</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming tasks</p>
            ) : (
              <ul className="space-y-2">
                {upcomingTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <span>{task.title}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(task.due_date!), 'MMM d')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
