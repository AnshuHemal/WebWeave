"use client"

import { useState, useTransition, useMemo } from "react"
import {
  History,
  Play,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Filter,
  ChevronRight,
  Code2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import prettyMs from "pretty-ms"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { rerunWorkflowAction } from "@/features/runs/actions"
import type { MappedRunRecord } from "@/features/runs/data"
import type { RunStatus } from "@/lib/db/schema"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: RunStatus }) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 font-medium text-xs">
          <CheckCircle2 className="size-3" /> Completed
        </Badge>
      )
    case "EXECUTING":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1 animate-pulse font-medium text-xs">
          <Activity className="size-3" /> Running
        </Badge>
      )
    case "QUEUED":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1 font-medium text-xs">
          <Clock className="size-3" /> Queued
        </Badge>
      )
    case "FAILED":
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 gap-1 font-medium text-xs">
          <XCircle className="size-3" /> Failed
        </Badge>
      )
    case "CANCELED":
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground gap-1 font-medium text-xs">
          Canceled
        </Badge>
      )
  }
}

function TriggerChip({ type }: { type: string }) {
  const map: Record<string, { label: string; bg: string }> = {
    webhook: { label: "Webhook", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    cron: { label: "Schedule", bg: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
    manual: { label: "Manual Run", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  }
  const item = map[type] || map.manual
  return (
    <span className={cn("rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", item.bg)}>
      {item.label}
    </span>
  )
}

// Pretty-print JSON
function JsonViewer({ data }: { data: unknown }) {
  if (!data) return <span className="text-muted-foreground italic text-xs">No data</span>
  return (
    <pre className="overflow-x-auto rounded-md bg-muted/40 border border-border p-3 text-[11px] font-mono leading-relaxed text-foreground whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

// ---------------------------------------------------------------------------
// Main Runs Page Component
// ---------------------------------------------------------------------------

export function RunsPage({ initialRuns }: { initialRuns: MappedRunRecord[] }) {
  const [runs, setRuns] = useState(initialRuns)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [selectedRun, setSelectedRun] = useState<MappedRunRecord | null>(null)
  const [isPending, startTransition] = useTransition()

  // Filtered runs based on search and status picker
  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      const matchesSearch =
        search === "" ||
        r.workflowName.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [runs, search, statusFilter])

  function handleRerun(workflowId: string, e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      try {
        await rerunWorkflowAction(workflowId)
        toast.success("Workflow re-run initiated!")
        window.location.reload()
      } catch {
        toast.error("Failed to trigger re-run")
      }
    })
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 overflow-y-auto max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Execution History
          </h2>
          <p className="text-muted-foreground">
            Audit past workflow executions, inspect node output variables, and trigger re-runs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by workflow name or run ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="EXECUTING">Running</SelectItem>
              <SelectItem value="QUEUED">Queued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Runs Data Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {filteredRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60">
              <History className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">No execution history found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search || statusFilter !== "ALL"
                ? "Try adjusting your search query or status filters."
                : "Run a workflow to populate execution logs."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => setSelectedRun(run)}
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 transition-colors hover:bg-muted/30 cursor-pointer"
              >
                {/* Workflow Name & ID */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Layers className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate group-hover:text-blue-400 transition-colors">
                        {run.workflowName}
                      </p>
                      <TriggerChip type={run.triggerType} />
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground truncate mt-0.5">
                      ID: {run.id}
                    </p>
                  </div>
                </div>

                {/* Status, Duration, & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">
                        {run.durationMs > 0 ? prettyMs(run.durationMs) : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleRerun(run.workflowId, e)}
                      title="Re-run workflow"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                    >
                      <RotateCcw className="size-3.5" />
                      Re-run
                    </Button>
                    <ChevronRight className="size-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-Over Detail Drawer */}
      <Sheet open={!!selectedRun} onOpenChange={(v) => !v && setSelectedRun(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-card border-border p-0 flex flex-col">
          {selectedRun && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={selectedRun.status} />
                  <TriggerChip type={selectedRun.triggerType} />
                </div>
                <SheetTitle className="text-lg font-bold">
                  {selectedRun.workflowName}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  Run ID: {selectedRun.id}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Started</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {format(new Date(selectedRun.startedAt), "MMM d, yyyy HH:mm:ss")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Duration</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {selectedRun.durationMs > 0 ? prettyMs(selectedRun.durationMs) : "In progress"}
                    </p>
                  </div>
                </div>

                {/* Failure Error Trace */}
                {selectedRun.error && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                    <p className="text-xs font-semibold text-rose-400 mb-1">Execution Error</p>
                    <p className="text-xs text-rose-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {selectedRun.error}
                    </p>
                  </div>
                )}

                {/* Step-by-step output tree */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Executed Steps ({selectedRun.steps.length})
                  </h4>

                  {selectedRun.steps.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No step details captured for this run.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedRun.steps.map((step, idx) => (
                        <div key={idx} className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <NodeIcon type={step.type} className="size-3.5 text-blue-400" />
                              <span className="text-xs font-semibold">{step.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {step.durationMs ? `${step.durationMs}ms` : "0ms"}
                            </span>
                          </div>
                          {step.error ? (
                            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded p-2 font-mono">
                              {step.error}
                            </p>
                          ) : (
                            <JsonViewer data={step.output} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
