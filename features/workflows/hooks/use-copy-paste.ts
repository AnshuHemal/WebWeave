"use client"

import { useEffect, useRef } from "react"
import { useReactFlow, type Edge } from "@xyflow/react"
import { toast } from "sonner"

import type { StepNodeType } from "@/features/workflows/nodes/node-registry"

export function useCopyPaste() {
  const { getNodes, getEdges, addNodes, addEdges } = useReactFlow<StepNodeType>()
  
  // Store copied elements in a ref so it persists between renders without state re-renders
  const clipboardRef = useRef<{
    nodes: StepNodeType[]
    edges: Edge[]
  }>({ nodes: [], edges: [] })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger copy/paste when user is typing inside inputs or textareas
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      const isModifier = e.metaKey || e.ctrlKey

      // Copy: Cmd+C / Ctrl+C
      if (isModifier && (e.key === "c" || e.key === "C")) {
        const nodes = getNodes()
        const selectedNodes = nodes.filter((n) => n.selected)

        if (selectedNodes.length === 0) return

        const selectedNodeIds = new Set(selectedNodes.map((n) => n.id))
        const edges = getEdges()
        const selectedEdges = edges.filter(
          (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
        )

        clipboardRef.current = {
          nodes: selectedNodes,
          edges: selectedEdges,
        }

        toast.success(`Copied ${selectedNodes.length} node${selectedNodes.length > 1 ? "s" : ""} to clipboard`)
      }

      // Paste: Cmd+V / Ctrl+V
      if (isModifier && (e.key === "v" || e.key === "V")) {
        const { nodes: copiedNodes, edges: copiedEdges } = clipboardRef.current

        if (copiedNodes.length === 0) return

        // Map old node IDs to new unique IDs
        const idMap = new Map<string, string>()

        const newNodes: StepNodeType[] = copiedNodes.map((node) => {
          const newId = crypto.randomUUID()
          idMap.set(node.id, newId)

          // Title numbering (e.g. "Open URL 1 (Copy)")
          const title = node.data.title.includes("(Copy)")
            ? node.data.title
            : `${node.data.title} (Copy)`

          return {
            ...node,
            id: newId,
            selected: true,
            position: {
              x: node.position.x + 40,
              y: node.position.y + 40,
            },
            data: {
              ...node.data,
              title,
            },
          }
        })

        // Map interconnecting edges to new node IDs
        const newEdges: Edge[] = copiedEdges.map((edge) => ({
          ...edge,
          id: crypto.randomUUID(),
          source: idMap.get(edge.source) || edge.source,
          target: idMap.get(edge.target) || edge.target,
        }))

        // Deselect current nodes before adding new pasted selection
        const allNodes = getNodes()
        allNodes.forEach((n) => {
          n.selected = false
        })

        addNodes(newNodes)
        if (newEdges.length > 0) {
          addEdges(newEdges)
        }

        toast.success(`Pasted ${newNodes.length} node${newNodes.length > 1 ? "s" : ""}`)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [getNodes, getEdges, addNodes, addEdges])
}
