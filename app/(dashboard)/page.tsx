import { auth } from "@clerk/nextjs/server"
import { runs } from "@trigger.dev/sdk"
import { RedirectToOrganizationProfile } from "@clerk/nextjs"

import { listWorkflows } from "@/features/workflows/data"
import { DashboardMetrics } from "@/features/workflows/components/dashboard-metrics"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { NewWorkflowButton } from "@/features/workflows/components/new-workflow-button"
import { WorkflowIcon } from "lucide-react"

export default async function Page() {
  const { orgId } = await auth()

  if (!orgId) {
    return (
      <div className="flex h-screen items-center justify-center p-8 bg-background">
        <Empty className="border-none shadow-none max-w-md">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WorkflowIcon className="text-muted-foreground animate-pulse" />
            </EmptyMedia>
            <EmptyTitle>No organization active</EmptyTitle>
            <EmptyDescription>
              Please select or create an organization from the switcher in the header to view WebWeave dashboard.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const workflows = await listWorkflows(orgId)
  
  if (workflows.length === 0) {
    return (
      <Empty className="min-h-svh border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WorkflowIcon className="text-blue-500 size-10" />
          </EmptyMedia>
          <EmptyTitle>Get started with WebWeave</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any workflows in this organization yet.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <NewWorkflowButton />
        </EmptyContent>
      </Empty>
    )
  }

  // Fetch recent executions from Trigger.dev
  let recentRuns: any[] = []
  try {
    const triggerRuns = await runs.list({ taskIdentifier: "run-workflow" })
    recentRuns = Array.from(triggerRuns.data || [])
  } catch (error) {
    console.error("Failed to retrieve runs from trigger.dev:", error)
  }

  const workflowsMap = new Map(workflows.map((w) => [w.id, w.name]))

  const mappedRuns = recentRuns
    .map((run) => {
      const workflowTag = run.tags.find((tag: string) => tag.startsWith("workflow:"))
      const workflowId = workflowTag ? workflowTag.split(":")[1] : ""
      const workflowName = workflowId ? (workflowsMap.get(workflowId) || "Deleted Workflow") : "Unknown Workflow"
      return {
        id: run.id,
        status: run.status,
        createdAt: run.createdAt instanceof Date ? run.createdAt.toISOString() : String(run.createdAt),
        durationMs: run.durationMs || 0,
        workflowName,
        workflowId,
      }
    })
    .filter((run) => run.workflowId && workflowsMap.has(run.workflowId))

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <DashboardMetrics runs={mappedRuns} workflowCount={workflows.length} />
    </div>
  )
}
