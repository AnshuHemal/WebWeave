import toposort from "toposort"
import { logger, metadata, task } from "@trigger.dev/sdk"
import type { DeserializedJson } from "@trigger.dev/core"
import { Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "@/features/workflows/nodes/node-executors"
import {
  interpolate,
  type NodeOutputs,
} from "@/features/workflows/lib/interpolate"
import { getWorkflow } from "@/features/workflows/data"
import type { NodeType } from "@/features/workflows/nodes/node-registry"
import { createRunRecord, finishRunRecord } from "@/features/runs/actions"

// One entry per node the run will walk, published to the run's metadata under
// "steps" so the canvas — and the run console below it — can watch each node
// move through its lifecycle live and inspect what it produced.
export type RunStep = {
  nodeId: string
  // The node's registry type (for its icon/accent) and title, denormalized so
  // the console can render a step without re-reading the graph.
  type: NodeType
  title: string
  status: "pending" | "running" | "done" | "failed"
  // Wall-clock time the executor took, set once the step leaves "running".
  durationMs?: number
  // Whatever the executor returned, kept for the console's per-step detail view.
  output?: unknown
  // The thrown error's message, set only when status is "failed".
  error?: string
}

// The Trigger.dev task the Run button fires. It loads the saved graph, works out
// what order the nodes should run in, and walks them. For now each node just
// announces itself — real execution (per-node executors, live progress, browser
// sessions) gets layered on from here.
export const runWorkflowTask = task({
  id: "run-workflow",
  run: async ({
    workflowId,
    orgId,
    triggerPayload,
  }: {
    workflowId: string
    orgId: string
    triggerPayload?: {
      body?: any
      headers?: any
      query?: any
      timestamp?: string
    }
  }) => {
    const runStartTime = Date.now()
    const triggerType = triggerPayload?.body ? "webhook" : "manual"

    // Create persistent run record in Neon DB
    let runRecordId: string | undefined = undefined
    try {
      const rec = await createRunRecord({ workflowId, orgId, triggerType })
      runRecordId = rec?.id
    } catch (e) {
      logger.warn("Failed to create run record in DB:", { error: String(e) })
    }

    const workflow = await getWorkflow(orgId, workflowId)
    if (!workflow?.graph) throw new Error(`Workflow ${workflowId} has no graph`)

    const { nodes, edges } = workflow.graph
    const byId = new Map(nodes.map((n) => [n.id, n]))

    // Run only connected nodes — anything touching an edge. Orphans dropped on
    // the canvas are skipped. toposort orders them and throws on a cycle.
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))
    const order = toposort
      .array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target])
      )
      .filter((id) => connected.has(id))

    logger.log(`Running workflow ${workflow.name}`, { steps: order.length })

    // Seed every step as "pending" up front and publish, so the canvas can render
    // the full run as a list of spinners before any node starts. type and title
    // are denormalized from the graph so the console can label each step without
    // it. We mutate these entries in place and re-publish on every status change.
    const steps: RunStep[] = order.map((nodeId) => {
      const node = byId.get(nodeId)!
      return {
        nodeId,
        type: node.data.type,
        title: node.data.title,
        status: "pending",
      }
    })

    // steps carries an arbitrary `output`, which is wider than trigger's
    // DeserializedJson metadata type; the values are JSON at runtime, so cast at
    // this one boundary rather than constraining the shape the console reads.
    const publishSteps = () =>
      metadata.set("steps", steps as unknown as DeserializedJson[])

    publishSteps()

    // The run owns one Browserbase session, opened lazily on the first browser step
    // and reused by every later one, so the recording spans the whole flow. The
    // LLM routes through Browserbase's Model Gateway (BROWSERBASE_API_KEY), so no
    // separate provider key is needed.
    let stagehand: Stagehand | undefined
    // The Browserbase session id, captured the moment the session opens so it can
    // be returned in the run's output — a panel reads it there to fetch the replay
    // once the run finishes and the recording is available.
    let browserbaseSessionId: string | undefined
    const getStagehand = async () => {
      if (stagehand) return stagehand
      stagehand = new Stagehand({
        env: "BROWSERBASE",
        apiKey: process.env.BROWSERBASE_API_KEY!,
        model: "google/gemini-2.5-flash",
        // Pino's logging backend spawns a thread-stream worker (lib/worker.js)
        // that can't be resolved inside trigger.dev's bundled output. Disable it —
        // the option exists for exactly these minimal/bundled environments.
        disablePino: true,
      })
      await stagehand.init()
      browserbaseSessionId = stagehand.browserbaseSessionID
      return stagehand
    }

    // Each node's result, keyed by its id, so later nodes can pull from it.
    // Because we walk in dependency order, every id a node references is already
    // populated by the time we run it.
    const outputs: NodeOutputs = {}

    // Find the start node to begin traversal
    const startNode = nodes.find((n) => n.data.type === "start")
    let currentId: string | undefined = startNode?.id

    const stepMap = new Map(steps.map((s) => [s.nodeId, s]))
    const visited = new Set<string>()

    while (currentId) {
      if (visited.has(currentId)) {
        logger.warn(`Cycle detected at node ${currentId}, breaking loop`)
        break
      }
      visited.add(currentId)

      const node = byId.get(currentId)!
      const step = stepMap.get(currentId)!
      logger.log(`Running step: ${node.data.title}`)

      // A node with no executor (the start trigger) does no work and produces no
      // output — mark it done rather than leaving it "pending".
      const executor = nodeExecutors[node.data.type]
      if (!executor) {
        if (node.data.kind === "trigger") {
          if (node.data.type === "webhook-trigger") {
            outputs[currentId] = {
              body: triggerPayload?.body || {},
              headers: triggerPayload?.headers || {},
              query: triggerPayload?.query || {},
            }
          } else if (node.data.type === "cron-trigger") {
            outputs[currentId] = {
              timestamp: triggerPayload?.timestamp || new Date().toISOString(),
            }
          } else {
            outputs[currentId] = {}
          }
          step.output = outputs[currentId]
        }
        step.status = "done"
        publishSteps()
        
        // Traverse to next node
        const nextEdges = edges.filter((e) => e.source === currentId)
        currentId = nextEdges[0]?.target
        continue
      }

      // Mark running before the executor and flush immediately: the "done" set
      // below happens before the SDK's next background flush, so without forcing
      // it here the "running" state is overwritten and the canvas never spins.
      step.status = "running"
      publishSteps()
      await metadata.flush()

      // Swap {{ nodeId.path }} placeholders for upstream output before running.
      const values = Object.fromEntries(
        Object.entries(node.data.values).map(([key, text]) => [
          key,
          interpolate({ text, outputs }),
        ])
      )

      // Time the executor so the console can show how long the step took, on
      // both the success and failure paths.
      const startedAt = Date.now()
      const maxRetries = Math.min(Number(values.maxRetries ?? 0), 5)
      const continueOnFail = values.continueOnFail === "true"
      let lastError: Error | null = null

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            logger.log(`Retrying step "${node.data.title}" (attempt ${attempt}/${maxRetries})`)
            await new Promise((res) => setTimeout(res, 1000 * attempt)) // exponential backoff
          }
          const output = await executor({ values, getStagehand })
          outputs[currentId] = output
          step.output = output
          lastError = null
          break
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          if (attempt < maxRetries) {
            step.error = `Attempt ${attempt + 1} failed: ${lastError.message}. Retrying...`
            publishSteps()
          }
        }
      }

      if (lastError) {
        if (continueOnFail) {
          // Skip this node gracefully; pass an error output so downstream nodes
          // can reference it, and mark it failed-but-skipped.
          outputs[currentId] = { error: lastError.message, skipped: true }
          step.output = outputs[currentId]
          step.status = "failed"
          step.durationMs = Date.now() - startedAt
          step.error = `[Skipped after ${maxRetries + 1} attempt(s)]: ${lastError.message}`
          publishSteps()
          await metadata.flush()
          // Continue to next node instead of throwing
          const nextEdges = edges.filter((e) => e.source === currentId)
          currentId = nextEdges[0]?.target
          continue
        }

        // Flush the "failed" state before the throw unwinds the run.
        step.status = "failed"
        step.durationMs = Date.now() - startedAt
        step.error = lastError.message
        publishSteps()
        await metadata.flush()
        await stagehand?.close()

        if (runRecordId) {
          await finishRunRecord({
            runRecordId,
            status: "FAILED",
            durationMs: Date.now() - runStartTime,
            error: lastError.message,
            steps,
          })
        }

        throw lastError
      }

      step.status = "done"
      step.durationMs = Date.now() - startedAt
      publishSteps()

      // Traverse to next node based on execution result
      const nextEdges = edges.filter((e) => e.source === currentId)
      if (nextEdges.length === 0) {
        currentId = undefined
      } else if (node.data.type === "if-else") {
        const result = outputs[currentId] as { branch: string } | undefined
        const branch = result?.branch || "true"
        const matchingEdge = nextEdges.find((e) => e.sourceHandle === branch)
        currentId = matchingEdge?.target
      } else {
        currentId = nextEdges[0].target
      }
    }

    await stagehand?.close()

    if (runRecordId) {
      await finishRunRecord({
        runRecordId,
        status: "COMPLETED",
        durationMs: Date.now() - runStartTime,
        steps,
      })
    }

    return { steps, browserbaseSessionId }
  },
})
