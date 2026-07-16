"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { tasks } from "@trigger.dev/sdk"
import { eq, and } from "drizzle-orm"

import { db } from "@/lib/db"
import { workflowRuns, workflows, type RunStatus } from "@/lib/db/schema"

/** Server-side action to trigger a re-run of a past execution */
export async function rerunWorkflowAction(workflowId: string) {
  const { orgId } = await auth()
  if (!orgId) throw new Error("No active organization")

  // Verify workflow exists and belongs to org
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.orgId, orgId)))

  if (!workflow) throw new Error("Workflow not found")

  // Trigger task
  const handle = await tasks.trigger(
    "run-workflow",
    { workflowId, orgId },
    { tags: [`workflow:${workflowId}`] }
  )

  revalidatePath("/runs")
  return { runId: handle.id }
}

/** Utility to write initial run record to DB when task starts */
export async function createRunRecord({
  workflowId,
  orgId,
  triggerType = "manual",
}: {
  workflowId: string
  orgId: string
  triggerType?: string
}) {
  const [inserted] = await db
    .insert(workflowRuns)
    .values({
      workflowId,
      orgId,
      status: "EXECUTING",
      triggerType,
      startedAt: new Date(),
    })
    .returning()

  return inserted
}

/** Utility to update run record in DB when task finishes or fails */
export async function finishRunRecord({
  runRecordId,
  status,
  durationMs,
  error,
  steps,
}: {
  runRecordId: string
  status: RunStatus
  durationMs: number
  error?: string
  steps?: any[]
}) {
  await db
    .update(workflowRuns)
    .set({
      status,
      durationMs: String(durationMs),
      error: error || null,
      steps: steps || [],
      completedAt: new Date(),
    })
    .where(eq(workflowRuns.id, runRecordId))
}
