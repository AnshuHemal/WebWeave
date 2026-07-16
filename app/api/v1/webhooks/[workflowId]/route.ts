import { NextResponse } from "next/server"
import { tasks } from "@trigger.dev/sdk"
import { db } from "@/lib/db"
import { workflows } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params

  // 1. Fetch the workflow to ensure it exists and get the orgId
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, workflowId))

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
  }

  // 2. Parse payload body, query parameters, and headers
  let body: any = {}
  try {
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      body = await request.json()
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData()
      body = Object.fromEntries(formData.entries())
    } else {
      const text = await request.text()
      body = { raw: text }
    }
  } catch {
    body = {}
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const query = Object.fromEntries(searchParams.entries())

  // Parse headers
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  try {
    // 3. Trigger workflow run via Trigger.dev task
    const handle = await tasks.trigger(
      "run-workflow",
      {
        workflowId,
        orgId: workflow.orgId,
        triggerPayload: {
          body,
          headers,
          query,
          timestamp: new Date().toISOString(),
        },
      },
      { tags: [`workflow:${workflowId}`] }
    )

    return NextResponse.json({
      message: "Webhook trigger successful. Workflow run started.",
      runId: handle.id,
    })
  } catch (error) {
    console.error("Failed to trigger workflow from webhook:", error)
    return NextResponse.json(
      { error: "Internal server error triggering workflow run" },
      { status: 500 }
    )
  }
}

// Support other HTTP methods in case webhooks send GET, PUT, etc.
export async function GET(request: Request, context: { params: Promise<{ workflowId: string }> }) {
  return POST(request, context)
}

export async function PUT(request: Request, context: { params: Promise<{ workflowId: string }> }) {
  return POST(request, context)
}
