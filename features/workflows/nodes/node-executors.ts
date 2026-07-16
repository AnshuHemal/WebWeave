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
import { httpRequest } from "./http-request"
import { codeNode } from "./code"

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
  "http-request": async ({ values }) =>
    httpRequest({
      url: values.url,
      method: values.method,
      authType: values.authType as any,
      authToken: values.authToken,
      authKeyName: values.authKeyName,
      authUsername: values.authUsername,
      authPassword: values.authPassword,
      headers: values.headers,
      queryParams: values.queryParams,
      bodyType: values.bodyType as any,
      body: values.body,
      timeoutMs: values.timeoutMs,
    }),
  code: async ({ values, getStagehand: _getStagehand, ...rest }) => {
    return codeNode({
      code: values.code,
      timeout: values.timeout,
      input: undefined,
    })
  },
  sticky: async () => ({}),
  loop: async ({ values }) => {
    let parsedItems: any[] = []
    const raw = values.items
    if (typeof raw === "string") {
      try {
        parsedItems = JSON.parse(raw)
      } catch {
        // Fallback for comma-separated or single string values
        parsedItems = raw.split(",").map((s) => s.trim())
      }
    } else if (Array.isArray(raw)) {
      parsedItems = raw
    }

    if (!Array.isArray(parsedItems)) {
      parsedItems = [parsedItems]
    }

    const max = Math.min(Number(values.maxIterations || 50), 100)
    const sliced = parsedItems.slice(0, max)

    return {
      items: sliced,
      total: sliced.length,
      item: sliced[0] || null,
      index: 0,
    }
  },
} satisfies Record<ActionNodeType, NodeExecutor>
