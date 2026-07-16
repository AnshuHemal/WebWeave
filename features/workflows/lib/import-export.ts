import type { WorkflowGraph } from "@/lib/db/schema"

export interface ExportedWorkflowFormat {
  version: string
  name: string
  exportedAt: string
  graph: WorkflowGraph
}

/**
 * Serializes a workflow's graph and metadata into a downloadable JSON string.
 */
export function exportWorkflowToJson(name: string, graph: WorkflowGraph): string {
  const payload: ExportedWorkflowFormat = {
    version: "1.0",
    name,
    exportedAt: new Date().toISOString(),
    graph: {
      nodes: graph?.nodes || [],
      edges: graph?.edges || [],
    },
  }
  return JSON.stringify(payload, null, 2)
}

/**
 * Triggers a browser download for a workflow JSON file.
 */
export function downloadWorkflowJson(name: string, graph: WorkflowGraph) {
  const json = exportWorkflowToJson(name, graph)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-workflow.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parses and validates an imported JSON string.
 * Returns the workflow name and validated graph structure.
 */
export function parseImportedWorkflowJson(jsonString: string): {
  name: string
  graph: WorkflowGraph
} {
  let parsed: any
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error("Invalid JSON file format.")
  }

  // Validate graph presence
  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON file must contain a valid object.")
  }

  const graph = parsed.graph || parsed
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error("Imported file is missing valid 'nodes' or 'edges' arrays.")
  }

  const name = parsed.name ? `${parsed.name} (Imported)` : "Imported Workflow"

  return {
    name,
    graph: {
      nodes: graph.nodes,
      edges: graph.edges,
    },
  }
}
