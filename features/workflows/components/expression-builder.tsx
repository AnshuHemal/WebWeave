"use client"

import { useState, useMemo } from "react"
import { Search, Variable, Sparkles, ChevronRight, Check } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { useUpstreamConnections, type UpstreamConnection } from "@/features/workflows/hooks/use-upstream-connections"
import { useLatestRunSteps } from "@/features/workflows/components/workflow-runs-provider"
import { nodeRegistry } from "@/features/workflows/nodes/node-registry"
import { cn } from "@/lib/utils"

interface ExpressionBuilderProps {
  onInsertToken: (token: string) => void
  activeFieldName?: string
}

export function ExpressionBuilder({
  onInsertToken,
  activeFieldName,
}: ExpressionBuilderProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const connections = useUpstreamConnections()
  const { steps } = useLatestRunSteps()

  // Map latest outputs by step nodeId for live value preview
  const outputsByNodeId = useMemo(() => {
    const map = new Map<string, any>()
    for (const step of steps) {
      if (step.output) {
        map.set(step.nodeId, step.output)
      }
    }
    return map
  }, [steps])

  // Filter connections by search term
  const filteredConnections = useMemo(() => {
    if (!search.trim()) return connections
    const q = search.toLowerCase()
    return connections.filter(
      (c) => c.label.toLowerCase().includes(q) || c.token.toLowerCase().includes(q)
    )
  }, [connections, search])

  // Helper to extract node details from token {{ nodeId.path }}
  const parseToken = (token: string) => {
    const raw = token.replace(/[\{\}\s]/g, "")
    const parts = raw.split(".")
    const nodeId = parts[0]
    const path = parts.slice(1).join(".")
    return { nodeId, path }
  }

  function handleSelect(connection: UpstreamConnection) {
    onInsertToken(connection.token)
    setOpen(false)
  }

  if (connections.length === 0) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 border-dashed border-blue-500/30 bg-blue-500/5 text-xs text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors"
        >
          <Sparkles className="size-3 text-blue-400" />
          <span>Insert Variable</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-80 p-0 bg-card/95 backdrop-blur-md border-border shadow-xl shadow-blue-950/10"
      >
        {/* Search Header */}
        <div className="flex items-center border-b border-border px-3 py-2 gap-2">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search variables & data..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 border-none bg-transparent text-xs shadow-none focus-visible:ring-0 px-0"
            autoFocus
          />
        </div>

        {/* Connections List */}
        <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
          {filteredConnections.length === 0 ? (
            <p className="p-3 text-center text-xs text-muted-foreground">
              No matching variables found
            </p>
          ) : (
            filteredConnections.map((conn) => {
              const { nodeId, path } = parseToken(conn.token)
              const latestOutput = outputsByNodeId.get(nodeId)
              let liveValue: string | undefined = undefined

              if (latestOutput && typeof latestOutput === "object") {
                const val = (latestOutput as any)[path]
                if (val !== undefined) {
                  liveValue = typeof val === "object" ? JSON.stringify(val) : String(val)
                }
              }

              return (
                <button
                  key={conn.token}
                  type="button"
                  onClick={() => handleSelect(conn)}
                  className="group w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-all hover:bg-blue-500/10 hover:border-blue-500/20 border border-transparent"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/60 group-hover:bg-blue-500/20 transition-colors">
                      <NodeIcon type={conn.nodeType} className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate text-foreground group-hover:text-blue-300">
                        {conn.label}
                      </p>
                      {liveValue !== undefined ? (
                        <p className="text-[10px] text-emerald-400 font-mono truncate">
                          Value: {liveValue}
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {conn.token}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-border bg-muted/30 px-3 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Click to insert token into active field</span>
          <span className="font-mono text-blue-400">{"{{ ... }}"}</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
