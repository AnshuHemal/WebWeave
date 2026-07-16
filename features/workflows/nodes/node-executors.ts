import type { Stagehand } from "@browserbasehq/stagehand"

import type {
  ActionNodeType,
  NodeType,
} from "@/features/workflows/nodes/node-registry"
import { act } from "./act"
import { agent } from "./agent"
import { extract } from "./extract"
import { observe } from "./observe"
import { openUrl } from "./open-url"
import { sendEmail } from "./send-email"

import { ifElse } from "./if-else"
import { waitNode } from "./wait"
import { webhook } from "./webhook"
import { slackNotify } from "./slack-notify"
import { sheetsAppend } from "./sheets-append"

export type NodeContext = {
  values: Record<string, string>
  getStagehand: () => Promise<Stagehand>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  "open-url": async ({ values, getStagehand }) =>
    openUrl({ stagehand: await getStagehand(), url: values.url }),
  act: async ({ values, getStagehand }) =>
    act({ stagehand: await getStagehand(), instruction: values.instruction }),
  extract: async ({ values, getStagehand }) =>
    extract({ stagehand: await getStagehand(), instruction: values.instruction }),
  observe: async ({ values, getStagehand }) =>
    observe({ stagehand: await getStagehand(), instruction: values.instruction }),
  agent: async ({ values, getStagehand }) =>
    agent({ stagehand: await getStagehand(), instruction: values.instruction }),
  "send-email": async ({ values }) =>
    sendEmail({ to: values.to, subject: values.subject, body: values.body }),
  "if-else": async ({ values, getStagehand }) =>
    ifElse({ stagehand: await getStagehand(), condition: values.condition }),
  wait: async ({ values }) =>
    waitNode({ seconds: Number(values.seconds || 0) }),
  webhook: async ({ values }) =>
    webhook({
      url: values.url,
      method: values.method,
      headers: values.headers,
      body: values.body,
    }),
  "slack-notify": async ({ values }) =>
    slackNotify({ webhookUrl: values.webhookUrl, text: values.text }),
  "sheets-append": async ({ values }) =>
    sheetsAppend({
      spreadsheetId: values.spreadsheetId,
      range: values.range,
      values: values.values,
    }),
} satisfies Record<ActionNodeType, NodeExecutor>
