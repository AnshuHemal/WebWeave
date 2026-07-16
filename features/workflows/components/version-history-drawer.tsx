"use client"

import { useEffect, useState, useTransition } from "react"
import { useReactFlow } from "@xyflow/react"
import { History, RotateCcw, Save, Layers, Clock } from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  createVersionSnapshotAction,
  getWorkflowVersionsAction,
  restoreWorkflowVersionAction,
} from "@/features/workflows/actions"
import type { WorkflowVersion } from "@/lib/db/schema"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"

export function VersionHistoryDrawer({
  workflowId,
  open,
  onOpenChange,
}: {
  workflowId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([])
  const [snapshotName, setSnapshotName] = useState("")
  const [isPending, startTransition] = useTransition()
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow<StepNodeType>()

  useEffect(() => {
    if (open && workflowId) {
      getWorkflowVersionsAction(workflowId)
        .then(setVersions)
        .catch(() => toast.error("Failed to load version history"))
    }
  }, [open, workflowId])

  function handleSaveSnapshot() {
    const name = snapshotName.trim() || `Snapshot v${versions.length + 1}`
    const graph = { nodes: getNodes(), edges: getEdges() }

    startTransition(async () => {
      try {
        const created = await createVersionSnapshotAction({
          workflowId,
          name,
          graph,
        })
        setVersions((prev) => [created, ...prev])
        setSnapshotName("")
        toast.success(`Saved version snapshot "${created.name}"`)
      } catch (err) {
        toast.error("Failed to save snapshot")
      }
    })
  }

  function handleRestoreVersion(version: WorkflowVersion) {
    startTransition(async () => {
      try {
        await restoreWorkflowVersionAction({
          workflowId,
          versionId: version.id,
        })

        // Restore graph into canvas local memory
        setNodes(version.graph.nodes)
        setEdges(version.graph.edges)

        toast.success(`Restored workflow to Version ${version.versionNumber}`)
        onOpenChange(false)
      } catch (err) {
        toast.error("Failed to restore version snapshot")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[500px] p-0 flex flex-col bg-card border-border">
        <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <History className="size-4" />
            </div>
            <SheetTitle className="text-lg font-bold">Version Snapshots</SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            Review past workflow revisions and restore any snapshot state with 1-click.
          </SheetDescription>
        </SheetHeader>

        {/* Create Snapshot Bar */}
        <div className="p-4 border-b border-border bg-muted/10 flex items-center gap-2">
          <Input
            placeholder="Snapshot title (e.g. Added Slack alert)..."
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            className="h-8 text-xs bg-card border-border"
          />
          <Button
            size="sm"
            disabled={isPending}
            onClick={handleSaveSnapshot}
            className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shrink-0"
          >
            <Save className="size-3.5" />
            <span>Save</span>
          </Button>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No version snapshots recorded yet. Click "Save" above to create your first checkpoint.
            </div>
          ) : (
            versions.map((ver) => (
              <div
                key={ver.id}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/60 hover:border-blue-500/40 hover:shadow-md transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      v{ver.versionNumber}
                    </Badge>
                    <span className="font-semibold text-xs">{ver.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(ver.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Layers className="size-3" />
                      {ver.graph?.nodes?.length || 0} nodes
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleRestoreVersion(ver)}
                  className="h-7 text-xs border-border hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 gap-1"
                >
                  <RotateCcw className="size-3" />
                  <span>Restore</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
