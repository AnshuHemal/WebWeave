import { db } from "@/lib/db"
import { workflowRuns, workflows, type RunStatus } from "@/lib/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"

export interface MappedRunRecord {
  id: string
  workflowId: string
  workflowName: string
  orgId: string
  status: RunStatus
  triggerType: string
  durationMs: number
  error: string | null
  steps: any[]
  startedAt: Date
  completedAt: Date | null
}

/**
 * Fetch all execution history records for an organization.
 * Includes joined workflow names.
 */
export async function getOrgRuns(orgId: string): Promise<MappedRunRecord[]> {
  const rows = await db
    .select({
      id: workflowRuns.id,
      workflowId: workflowRuns.workflowId,
      workflowName: workflows.name,
      orgId: workflowRuns.orgId,
      status: workflowRuns.status,
      triggerType: workflowRuns.triggerType,
      durationMs: workflowRuns.durationMs,
      error: workflowRuns.error,
      steps: workflowRuns.steps,
      startedAt: workflowRuns.startedAt,
      completedAt: workflowRuns.completedAt,
    })
    .from(workflowRuns)
    .leftJoin(workflows, eq(workflowRuns.workflowId, workflows.id))
    .where(eq(workflowRuns.orgId, orgId))
    .orderBy(desc(workflowRuns.startedAt))

  return rows.map((r) => ({
    id: r.id,
    workflowId: r.workflowId,
    workflowName: r.workflowName || "Deleted Workflow",
    orgId: r.orgId,
    status: r.status,
    triggerType: r.triggerType,
    durationMs: Number(r.durationMs || 0),
    error: r.error,
    steps: (r.steps as any[]) || [],
    startedAt: r.startedAt,
    completedAt: r.completedAt,
  }))
}
