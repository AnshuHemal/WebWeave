"use client"

import { useMemo } from "react"
import { CheckCircle2, XCircle, Clock, Loader2, ChevronRight } from "lucide-react"
import { useStore } from "@xyflow/react"

import { useLatestRunSteps } from "@/features/workflows/components/workflow-runs-provider"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { cn } from "@/lib/utils"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: RunStep["status"] }) {
  if (status === "done")
    return <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
  if (status === "failed")
    return <XCircle className="size-3.5 shrink-0 text-rose-500" />
  if (status === "running")
    return <Loader2 className="size-3.5 shrink-0 animate-spin text-cyan-400" />
  return <Clock className="size-3.5 shrink-0 text-muted-foreground" />
}

function StatusBadge({ status }: { status: RunStep["status"] }) {
  const map = {
    done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    running: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    pending: "bg-muted/40 text-muted-foreground border-border",
  } as const
  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        map[status]
      )}
    >
      {status}
    </span>
  )
}

// Pretty-print any JSON-serializable value in a scrollable code block.
function JsonView({ value }: { value: unknown }) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground italic text-xs">No data</span>
  }
  return (
    <pre className="overflow-x-auto rounded-md bg-muted/30 border border-border p-2 text-[10px] leading-relaxed text-foreground whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

// ---------------------------------------------------------------------------
// Per-step row
// ---------------------------------------------------------------------------

function StepRow({
  step,
  isSelected,
  onClick,
}: {
  step: RunStep
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-muted/50"
      )}
    >
      <StatusIcon status={step.status} />
      <NodeIcon type={step.type} className="size-3.5 shrink-0" />
      <span className="flex-1 truncate text-xs font-medium">{step.title}</span>
      {step.durationMs !== undefined && (
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {step.durationMs}ms
        </span>
      )}
      <ChevronRight
        className={cn(
          "size-3 shrink-0 text-muted-foreground transition-transform",
          isSelected && "rotate-90"
        )}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Detail panel shown below the selected step
// ---------------------------------------------------------------------------

function StepDetail({ step }: { step: RunStep }) {
  return (
    <div className="mx-2 mb-2 rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <NodeIcon type={step.type} className="size-3.5" />
          <span className="text-xs font-semibold truncate">{step.title}</span>
        </div>
        <StatusBadge status={step.status} />
      </div>

      <div className="flex flex-col gap-3 p-3">
        {/* Error */}
        {step.error && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
              Error
            </p>
            <p className="rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-1.5 text-[11px] text-rose-300 break-words">
              {step.error}
            </p>
          </div>
        )}

        {/* Output */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Output
          </p>
          <JsonView value={step.output} />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The full inspector panel
// ---------------------------------------------------------------------------

export function ExecutionInspector() {
  const { steps, isLive } = useLatestRunSteps()

  // The currently selected node on the canvas — we highlight its matching step.
  const selectedNode = useStore(
    (s) => s.nodes.find((n) => n.selected)
  ) as StepNodeType | undefined

  const selectedStep = useMemo(
    () => (selectedNode ? steps.find((s) => s.nodeId === selectedNode.id) : undefined),
    [steps, selectedNode]
  )

  if (steps.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Clock className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No runs yet</p>
        <p className="text-xs text-muted-foreground">
          Run your workflow to see input & output data for each node here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Run status banner */}
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border px-3 py-2 text-xs font-medium",
          isLive
            ? "bg-cyan-500/10 text-cyan-300"
            : "bg-muted/30 text-muted-foreground"
        )}
      >
        {isLive ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="size-3.5" />
        )}
        {isLive ? "Workflow running…" : `${steps.length} step${steps.length !== 1 ? "s" : ""} completed`}
      </div>

      {/* Step list with inline expand */}
      <div className="flex flex-col gap-0.5 p-2">
        {steps.map((step) => {
          const isSelected = step.nodeId === selectedNode?.id
          return (
            <div key={step.nodeId}>
              <StepRow
                step={step}
                isSelected={isSelected}
                onClick={() => {
                  // Selecting a step here doesn't select the canvas node —
                  // that would require emitting a React Flow selection event.
                  // The expansion is driven by canvas selection instead.
                }}
              />
              {isSelected && <StepDetail step={step} />}
            </div>
          )
        })}
      </div>

      {/* If nothing is selected, show hint */}
      {!selectedStep && steps.some((s) => s.status !== "pending") && (
        <p className="px-4 pb-4 text-center text-[11px] text-muted-foreground">
          Click a node on the canvas to inspect its input/output data.
        </p>
      )}
    </div>
  )
}
