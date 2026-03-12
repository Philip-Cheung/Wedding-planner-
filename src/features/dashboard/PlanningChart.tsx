import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { supabase } from '@/lib/supabase'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { useIsMobile } from '@/hooks/use-mobile'

type ChartDataPoint = {
  date: string
  week: string
  tasks: number
  guests: number
}

const chartConfig = {
  tasks: {
    label: 'Tasks',
    color: 'var(--primary)',
  },
  guests: {
    label: 'Guests',
    color: 'var(--muted-foreground)',
  },
} satisfies ChartConfig

function aggregateByWeek(
  taskDates: string[],
  guestDates: string[],
  daysBack: number
): ChartDataPoint[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const points: ChartDataPoint[] = []
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const numWeeks = Math.max(1, Math.floor(daysBack / 7))

  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * weekMs)
    const weekEnd = new Date(weekStart.getTime() + weekMs)

    const tasks = taskDates.filter((d) => {
      const t = new Date(d).getTime()
      return t >= weekStart.getTime() && t < weekEnd.getTime()
    }).length
    const guests = guestDates.filter((d) => {
      const t = new Date(d).getTime()
      return t >= weekStart.getTime() && t < weekEnd.getTime()
    }).length

    points.push({
      date: weekStart.toISOString().slice(0, 10),
      week: weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      tasks,
      guests,
    })
  }

  return points
}

type Props = {
  weddingId: string
}

export function PlanningChart({ weddingId }: Props) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState(isMobile ? '7d' : '90d')
  const [data, setData] = React.useState<ChartDataPoint[]>([])

  React.useEffect(() => {
    if (isMobile && timeRange === '90d') setTimeRange('7d')
  }, [isMobile])

  React.useEffect(() => {
    const load = async () => {
      const [tasksRes, guestsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('created_at')
          .eq('wedding_id', weddingId),
        supabase
          .from('guests')
          .select('created_at')
          .eq('wedding_id', weddingId),
      ])

      const taskDates = (tasksRes.data ?? []).map((t) => t.created_at)
      const guestDates = (guestsRes.data ?? []).map((g) => g.created_at)

      const daysBack = timeRange === '90d' ? 90 : timeRange === '30d' ? 30 : 7
      setData(aggregateByWeek(taskDates, guestDates, daysBack))
    }

    load()
  }, [weddingId, timeRange])

  const filteredData = data

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Planning Activity</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Tasks and guests added over time
          </span>
          <span className="@[540px]/card:hidden">Activity over time</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillTasks" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-tasks)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-tasks)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillGuests" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-guests)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-guests)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="tasks"
              type="natural"
              fill="url(#fillTasks)"
              stroke="var(--color-tasks)"
              stackId="a"
            />
            <Area
              dataKey="guests"
              type="natural"
              fill="url(#fillGuests)"
              stroke="var(--color-guests)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
