import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { getOrgRuns } from "@/features/runs/data"
import { RunsPage } from "@/features/runs/components/runs-page"

export const metadata = {
  title: "Execution History — WebWeave",
  description: "Audit past workflow executions, inspect node output variables, and trigger re-runs.",
}

export default async function Page() {
  const { orgId } = await auth()
  if (!orgId) redirect("/sign-in")

  const runs = await getOrgRuns(orgId)

  return <RunsPage initialRuns={runs} />
}
