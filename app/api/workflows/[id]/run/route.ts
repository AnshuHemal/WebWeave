import { NextResponse } from "next/server"
import { tasks } from "@trigger.dev/sdk"
import { db } from "@/lib/db"
import { workflows } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Authenticate API Request
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const expectedToken = process.env.TRIGGER_SECRET_KEY
  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized API Key" }, { status: 401 })
  }

  // Retrieve matching workflow
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, id))

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
  }

  try {
    // Trigger background execution task via Trigger.dev
    const handle = await tasks.trigger(
      "run-workflow",
      { workflowId: id, orgId: workflow.orgId },
      { tags: [`workflow:${id}`] }
    )

    return NextResponse.json({
      message: "WebWeave workflow triggered successfully.",
      runId: handle.id,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Failed to trigger programmatic workflow run:", error)
    return NextResponse.json(
      { error: "Internal server error triggering task" },
      { status: 500 }
    )
  }
}
