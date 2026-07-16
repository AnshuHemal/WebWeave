"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import {
  Controls,
  ReactFlow,
  ConnectionLineType,
  type ColorMode,
  type Edge,
  NodeTypes,
  Panel,
} from "@xyflow/react"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { AvatarStack } from "@liveblocks/react-ui";

import { useState } from "react"
import { Search, Plus } from "lucide-react"
import { StepNode } from "@/features/workflows/components/step-node"
import { StickyNoteNode } from "@/features/workflows/components/sticky-note-node"
import { NodeCommandPalette } from "@/features/workflows/components/node-command-palette"
import { useCopyPaste } from "@/features/workflows/hooks/use-copy-paste"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"
import type { WorkflowGraph } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

const nodeTypes: NodeTypes = { step: StepNode, sticky: StickyNoteNode }

const initialNodes: StepNodeType[] = [
  {
    id: "start",
    type: "step",
    position: { x: 0, y: 0 },
    data: { type: "start", kind: "trigger", title: "Start", values: {} },
  },
]

const initialEdges: Edge[] = []

const emptySubscribe = () => () => { }

// False during server render and hydration, true after mount. Keeps the
// server and initial client render identical to avoid a hydration mismatch.
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

function CanvasInner({
  paletteOpen,
  setPaletteOpen,
}: {
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
}) {
  // Wire multi-node copy and paste keyboard shortcut hook inside ReactFlow context
  useCopyPaste()

  return (
    <>
      <Controls />
      <Cursors />
      <Panel position="top-left" className="m-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPaletteOpen(true)}
          className="h-8 gap-2 bg-card/90 backdrop-blur border-border text-xs text-muted-foreground hover:text-foreground shadow-sm"
        >
          <Search className="size-3.5 text-blue-400" />
          <span>Search nodes...</span>
          <kbd className="pointer-events-none hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </Panel>
      <Panel position="top-right">
        <AvatarStack />
      </Panel>
      <NodeCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  )
}

export function Canvas({ initialGraph }: { initialGraph?: WorkflowGraph }) {
  const { resolvedTheme } = useTheme()
  const mounted = useMounted()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const colorMode: ColorMode = mounted
    ? (resolvedTheme as ColorMode) ?? "light"
    : "light"

  const defaultNodes: StepNodeType[] =
    initialGraph?.nodes && initialGraph.nodes.length > 0
      ? initialGraph.nodes
      : initialNodes

  const defaultEdges: Edge[] = initialGraph?.edges || initialEdges

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow({
    suspense: true,
    nodes: { initial: defaultNodes },
    edges: { initial: defaultEdges },
  })

  return (
    <div className="relative size-full">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        colorMode={colorMode}
        fitView
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: "var(--border)" }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "var(--border)" },
        }}
        style={
          {
            "--xy-background-color": "var(--background)",
            "--xy-edge-stroke-width": 2,
            "--xy-connectionline-stroke-width": 2,
          } as React.CSSProperties
        }
        maxZoom={1}
      >
        <CanvasInner paletteOpen={paletteOpen} setPaletteOpen={setPaletteOpen} />
      </ReactFlow>
    </div>
  )
}
