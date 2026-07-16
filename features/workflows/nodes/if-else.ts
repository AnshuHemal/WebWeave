import type { Stagehand } from "@browserbasehq/stagehand"
import { z } from "zod"

export async function ifElse({
  stagehand,
  condition,
}: {
  stagehand: Stagehand
  condition: string
}) {
  const schema = z.object({
    isConditionMet: z.boolean().describe("Whether the condition is met (true) or not (false) on the current page"),
    reason: z.string().describe("A brief explanation for the decision"),
  })

  const result = await stagehand.extract(
    `Evaluate this condition on the current page: "${condition}". Determine if the condition is met and output the boolean field 'isConditionMet' and the reason string 'reason'.`,
    schema
  )

  return {
    branch: result.isConditionMet ? "true" : "false",
    reason: result.reason,
  }
}
