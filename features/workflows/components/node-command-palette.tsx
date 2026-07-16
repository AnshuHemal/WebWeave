"use client"

import { useEffect, useState, useMemo } from "react"
import { useReactFlow, useStore } from "@xyflow/react"
import { Search, Sparkles, Plus, Command as CommandIcon } from "lucide-react"
import { toast } from "sonner"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { useProPlan } from "@/features/workflows/hooks/use-pro-plan"
import { cn } from "@/lib/utils"

const definitions = (Object.keys(nodeRegistry) as NodeType[]).map((type) => ({
  ...nodeRegistry[type],
  type,
}))
const premiumNodes = new Set<NodeType>(["agent"])

export function NodeCommandPalette({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = (val: boolean) => {
    if (isControlled) {
      externalOnOpenChange?.(val)
    } else {
      setInternalOpen(val)
    }
  }

  const { getNodes, getViewport, addNodes } = useReactFlow<StepNodeType>()
  const width = useStore((s) => s.width)
  const height = useStore((s) => s.height)
  const { isLoaded, isPro, goToUpgrade } = useProPlan()

  // Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open])

  const isLocked = (type: NodeType) =>
    premiumNodes.has(type) && isLoaded && !isPro

  const handleSelectNode = (type: NodeType) => {
    if (isLocked(type)) {
      goToUpgrade()
      setOpen(false)
      return
    }

    const def = nodeRegistry[type]
    const nodes = getNodes()

    // Single trigger constraint
    if (def.kind === "trigger" && nodes.some((n) => n.data.kind === "trigger")) {
      toast.error("A workflow can only have one trigger.")
      setOpen(false)
      return
    }

    const count = nodes.filter((n) => n.data.type === type).length
    const title = `${def.label} ${count + 1}`

    const { x, y, zoom } = getViewport()
    const position = {
      x: ((width || 800) / 2 - x) / zoom,
      y: ((height || 600) / 2 - y) / zoom,
    }

    addNodes({
      id: crypto.randomUUID(),
      type: "step",
      position,
      data: { type, kind: def.kind, title, values: {} },
    })

    toast.success(`Added "${title}" to canvas`)
    setOpen(false)
  }

  const triggers = useMemo(() => definitions.filter((d) => d.kind === "trigger"), [])
  const actions = useMemo(() => definitions.filter((d) => d.kind === "action"), [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search nodes (e.g. Webhook, HTTP Request, Code)..." />
      <CommandList className="max-h-80">
        <CommandEmpty>No matching nodes found.</CommandEmpty>
        
        <CommandGroup heading="Triggers">
          {triggers.map((def) => (
            <CommandItem
              key={def.type}
              value={`${def.label} ${def.type}`}
              onSelect={() => handleSelectNode(def.type)}
              className="flex items-center justify-between py-2 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <NodeIcon type={def.type} className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{def.label}</p>
                  <p className="text-[10px] text-muted-foreground">Workflow Entry Trigger</p>
                </div>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                Trigger
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Actions & Connectors">
          {actions.map((def) => (
            <CommandItem
              key={def.type}
              value={`${def.label} ${def.type}`}
              onSelect={() => handleSelectNode(def.type)}
              className="flex items-center justify-between py-2 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted/60 text-foreground">
                  <NodeIcon type={def.type} className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{def.label}</p>
                  <p className="text-[10px] text-muted-foreground">{def.outputs.length} Output Fields</p>
                </div>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/40 border border-border px-1.5 py-0.5 rounded">
                Action
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
