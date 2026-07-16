"use client"

import { useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import {
  Activity,
  CheckCircle2,
  Clock,
  Play,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import prettyMs from "pretty-ms"

// Trigger.dev run status types
type RunStatus =
  | "PENDING_VERSION"
  | "QUEUED"
  | "DEQUEUED"
  | "EXECUTING"
  | "WAITING"
  | "COMPLETED"
  | "CANCELED"
  | "FAILED"
  | "CRASHED"
  | "SYSTEM_FAILURE"
  | "DELAYED"
  | "EXPIRED"
  | "TIMED_OUT"

interface RunData {
  id: string
  status: RunStatus
  createdAt: string
  durationMs: number
  workflowName: string
  workflowId: string
}

interface DashboardMetricsProps {
  runs: RunData[]
  workflowCount: number
}

export function DashboardMetrics({ runs, workflowCount }: DashboardMetricsProps) {
  // Aggregate statistics
  const stats = useMemo(() => {
    const total = runs.length
    if (total === 0) {
      return {
        total,
        successRate: 0,
        avgDuration: 0,
        active: 0,
      }
    }

    const completed = runs.filter((r) => r.status === "COMPLETED").length
    const failed = runs.filter(
      (r) =>
        r.status === "FAILED" ||
        r.status === "CRASHED" ||
        r.status === "SYSTEM_FAILURE" ||
        r.status === "TIMED_OUT"
    ).length
    const active = runs.filter(
      (r) => r.status === "EXECUTING" || r.status === "QUEUED"
    ).length

    // Avoid dividing by zero if there are no finalized runs
    const finalized = completed + failed
    const successRate = finalized > 0 ? (completed / finalized) * 100 : 0

    const totalDuration = runs
      .filter((r) => r.durationMs > 0)
      .reduce((sum, r) => sum + r.durationMs, 0)
    const runsWithDuration = runs.filter((r) => r.durationMs > 0).length
    const avgDuration = runsWithDuration > 0 ? totalDuration / runsWithDuration : 0

    return {
      total,
      successRate: Math.round(successRate),
      avgDuration: Math.round(avgDuration),
      active,
    }
  }, [runs])

  // Daily run volume for Recharts
  const chartData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; runs: number; success: number }>()

    // Fill last 7 days with zeros
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      dailyMap.set(dateStr, { date: dateStr, runs: 0, success: 0 })
    }

    runs.forEach((run) => {
      const dateStr = new Date(run.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })

      const existing = dailyMap.get(dateStr)
      if (existing) {
        existing.runs += 1
        if (run.status === "COMPLETED") {
          existing.success += 1
        }
      }
    })

    return Array.from(dailyMap.values())
  }, [runs])

  const getStatusBadge = (status: RunStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 font-medium">
            <CheckCircle2 className="size-3" /> Success
          </Badge>
        )
      case "EXECUTING":
        return (
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 gap-1 animate-pulse font-medium">
            <Activity className="size-3" /> Running
          </Badge>
        )
      case "QUEUED":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 font-medium">
            <Clock className="size-3" /> Queued
          </Badge>
        )
      case "FAILED":
      case "CRASHED":
      case "SYSTEM_FAILURE":
      case "TIMED_OUT":
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 gap-1 font-medium">
            <XCircle className="size-3" /> Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground gap-1 font-medium">
            {status.toLowerCase()}
          </Badge>
        )
    }
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 overflow-y-auto max-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage your visual browser automation tasks in real-time.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden transition-all hover:shadow-md border bg-card/60 backdrop-blur-sm group">
          <div className="absolute top-0 left-0 h-full w-[4px] bg-blue-500 transition-transform" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Workflows
            </CardTitle>
            <Zap className="size-4 text-blue-500 transition-transform group-hover:scale-110" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowCount}</div>
            <p className="text-xs text-muted-foreground">Active templates in organization</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-md border bg-card/60 backdrop-blur-sm group">
          <div className="absolute top-0 left-0 h-full w-[4px] bg-cyan-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Executions
            </CardTitle>
            <Play className="size-4 text-cyan-500 transition-transform group-hover:scale-110" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active > 0 ? `${stats.active} running right now` : "No active runs currently"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-md border bg-card/60 backdrop-blur-sm group">
          <div className="absolute top-0 left-0 h-full w-[4px] bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-500 transition-transform group-hover:scale-110" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Percentage of completed runs</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-md border bg-card/60 backdrop-blur-sm group">
          <div className="absolute top-0 left-0 h-full w-[4px] bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Duration
            </CardTitle>
            <Clock className="size-4 text-amber-500 transition-transform group-hover:scale-110" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgDuration > 0 ? prettyMs(stats.avgDuration, { compact: true }) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Average automation speed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Analytics Graphs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Execution Frequency</CardTitle>
            <CardDescription>Daily run history over the last week</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="runs"
                    name="Runs Started"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorRuns)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Success Breakdown</CardTitle>
            <CardDescription>Successful execution ratio per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="success" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="runs" name="Total Runs" fill="#e2e8f0" opacity={0.3} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs List */}
      <Card className="bg-card/40 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Executions</CardTitle>
            <CardDescription>Status and duration of the latest automated runs</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {runs.length === 0 ? (
              <div className="flex h-[100px] items-center justify-center text-sm text-muted-foreground">
                No runs recorded yet. Deploy a workflow and click Run.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {runs.slice(0, 5).map((run) => (
                  <div key={run.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold tracking-tight leading-none">
                        {run.workflowName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: <span className="font-mono text-muted-foreground/80">{run.id}</span> •{" "}
                        {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {run.durationMs > 0 ? prettyMs(run.durationMs) : "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">duration</p>
                      </div>
                      <div className="w-[100px] flex justify-end">
                        {getStatusBadge(run.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
