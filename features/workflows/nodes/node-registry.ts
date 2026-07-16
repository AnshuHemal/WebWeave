import type { Node } from "@xyflow/react"
import {
  Bot,
  Clock,
  Code2,
  Eye,
  GitFork,
  Globe,
  Globe2,
  Mail,
  MessageSquare,
  MousePointerClick,
  Pointer,
  ScanText,
  Table,
  Webhook,
  type LucideIcon,
} from "lucide-react"

export type StepNodeKind = "trigger" | "action"

// One editable field on a node, rendered as an input in the inspector later.
export type NodeField = {
  key: string
  label: string
  placeholder?: string
  // Render as a multi-line textarea instead of a single-line input.
  multiline?: boolean
  // Render as a Monaco (VS Code) code editor for JavaScript/JSON.
  monaco?: boolean
  required?: boolean
}

export type NodeOutput = {
  path: string
  label: string
}

// A node type's manifest entry. Add a node by adding an entry to nodeRegistry.
export type NodeDefinition = {
  type: string
  kind: StepNodeKind
  label: string
  icon: LucideIcon
  accent: string // Tailwind classes for the icon chip color
  fields: NodeField[]
  outputs: NodeOutput[]
}

export const nodeRegistry = {
  start: {
    type: "start",
    kind: "trigger",
    label: "Start",
    icon: MousePointerClick,
    accent: "bg-blue-500 text-white",
    fields: [],
    outputs: [],
  },
  "webhook-trigger": {
    type: "webhook-trigger",
    kind: "trigger",
    label: "Webhook Trigger",
    icon: Webhook,
    accent: "bg-cyan-600 text-white",
    fields: [
      {
        key: "path",
        label: "Webhook Path Slug",
        placeholder: "my-custom-webhook",
        required: true,
      },
    ],
    outputs: [
      { path: "body", label: "Request Body" },
      { path: "headers", label: "Request Headers" },
      { path: "query", label: "Query Parameters" },
    ],
  },
  "cron-trigger": {
    type: "cron-trigger",
    kind: "trigger",
    label: "Cron Trigger",
    icon: Clock,
    accent: "bg-blue-600 text-white",
    fields: [
      {
        key: "expression",
        label: "Cron Expression",
        placeholder: "0 9 * * * (Every day at 9am)",
        required: true,
      },
    ],
    outputs: [
      { path: "timestamp", label: "Trigger Timestamp" },
    ],
  },
  "open-url": {
    type: "open-url",
    kind: "action",
    label: "Open URL",
    icon: Globe,
    accent: "bg-emerald-500 text-white",
    fields: [
      { key: "url", label: "URL", placeholder: "https://youtube.com", required: true },
    ],
    outputs: [
      { path: "url", label: "URL" },
      { path: "title", label: "Title" },
    ],
  },
  act: {
    type: "act",
    kind: "action",
    label: "Act",
    icon: Pointer,
    accent: "bg-teal-600 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Click the sign in button",
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: "success", label: "Success" },
      { path: "message", label: "Message" },
      { path: "url", label: "URL" },
    ],
  },
  extract: {
    type: "extract",
    kind: "action",
    label: "Extract",
    icon: ScanText,
    accent: "bg-amber-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Extract the product price",
        multiline: true,
        required: true,
      },
    ],
    outputs: [{ path: "extraction", label: "Extraction" }],
  },
  observe: {
    type: "observe",
    kind: "action",
    label: "Observe",
    icon: Eye,
    accent: "bg-sky-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Find the sign in button",
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: "matches", label: "Matches" },
      { path: "matches[0].selector", label: "Selector" },
      { path: "matches[0].description", label: "Description" },
    ],
  },
  agent: {
    type: "agent",
    kind: "action",
    label: "Agent",
    icon: Bot,
    accent: "bg-rose-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Search for the stock price of NVDA",
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: "success", label: "Success" },
      { path: "message", label: "Message" },
      { path: "completed", label: "Completed" },
    ],
  },
  "send-email": {
    type: "send-email",
    kind: "action",
    label: "Send Email",
    icon: Mail,
    accent: "bg-teal-500 text-white",
    fields: [
      { key: "to", label: "To", placeholder: "person@example.com", required: true },
      { key: "subject", label: "Subject", placeholder: "Hello", required: true },
      {
        key: "body",
        label: "Body",
        placeholder: "Write your message…",
        multiline: true,
        required: true,
      },
    ],
    outputs: [{ path: "id", label: "Email ID" }],
  },
  "if-else": {
    type: "if-else",
    kind: "action",
    label: "If / Else",
    icon: GitFork,
    accent: "bg-indigo-500 text-white",
    fields: [
      {
        key: "condition",
        label: "Condition (NL)",
        placeholder: "Is the price less than $100?",
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: "branch", label: "Branch (true/false)" },
      { path: "reason", label: "Reasoning" },
    ],
  },
  wait: {
    type: "wait",
    kind: "action",
    label: "Wait",
    icon: Clock,
    accent: "bg-zinc-500 text-white",
    fields: [
      {
        key: "seconds",
        label: "Wait Seconds",
        placeholder: "5",
        required: true,
      },
    ],
    outputs: [
      { path: "seconds", label: "Waited Seconds" },
    ],
  },
  webhook: {
    type: "webhook",
    kind: "action",
    label: "Webhook",
    icon: Webhook,
    accent: "bg-fuchsia-500 text-white",
    fields: [
      {
        key: "url",
        label: "Webhook URL",
        placeholder: "https://api.example.com/webhook",
        required: true,
      },
      {
        key: "method",
        label: "Method",
        placeholder: "POST",
        required: true,
      },
      {
        key: "headers",
        label: "Headers (JSON)",
        placeholder: '{"Content-Type": "application/json"}',
        multiline: true,
      },
      {
        key: "body",
        label: "Body (JSON)",
        placeholder: '{"data": "{{ node_id.extraction }}"}',
        multiline: true,
      },
    ],
    outputs: [
      { path: "status", label: "Status Code" },
      { path: "response", label: "Response" },
    ],
  },
  "slack-notify": {
    type: "slack-notify",
    kind: "action",
    label: "Slack Notify",
    icon: MessageSquare,
    accent: "bg-rose-600 text-white",
    fields: [
      {
        key: "webhookUrl",
        label: "Slack Webhook URL",
        placeholder: "https://hooks.slack.com/services/...",
        required: true,
      },
      {
        key: "text",
        label: "Message Text",
        placeholder: "Hello from WebWeave: {{ node_id.extraction }}",
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: "sent", label: "Message Sent" },
    ],
  },
  "sheets-append": {
    type: "sheets-append",
    kind: "action",
    label: "Sheets Append",
    icon: Table,
    accent: "bg-emerald-600 text-white",
    fields: [
      {
        key: "spreadsheetId",
        label: "Spreadsheet ID",
        placeholder: "1xyz...",
        required: true,
      },
      {
        key: "range",
        label: "Range / Sheet Name",
        placeholder: "Sheet1",
        required: true,
      },
      {
        key: "values",
        label: "Values (JSON Array)",
        placeholder: '["{{ node_id.title }}", "{{ node_id.url }}"]',
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: "updatedRange", label: "Updated Range" },
    ],
  },
  "http-request": {
    type: "http-request",
    kind: "action",
    label: "HTTP Request",
    icon: Globe2,
    accent: "bg-indigo-600 text-white",
    fields: [
      {
        key: "url",
        label: "URL",
        placeholder: "https://api.example.com/data",
        required: true,
      },
      {
        key: "method",
        label: "Method",
        placeholder: "GET",
        required: true,
      },
      {
        key: "authType",
        label: "Auth Type",
        placeholder: "none | bearer | apikey-header | apikey-query | basic",
      },
      {
        key: "authToken",
        label: "Bearer / API Key Value",
        placeholder: "sk-...",
      },
      {
        key: "authKeyName",
        label: "API Key Header / Param Name",
        placeholder: "X-API-Key",
      },
      {
        key: "authUsername",
        label: "Basic Auth Username",
        placeholder: "admin",
      },
      {
        key: "authPassword",
        label: "Basic Auth Password",
        placeholder: "••••••••",
      },
      {
        key: "headers",
        label: "Headers (JSON)",
        placeholder: '{"Accept": "application/json"}',
        multiline: true,
      },
      {
        key: "queryParams",
        label: "Query Params (JSON)",
        placeholder: '{"page": "1", "limit": "50"}',
        multiline: true,
      },
      {
        key: "bodyType",
        label: "Body Type",
        placeholder: "none | json | form | raw",
      },
      {
        key: "body",
        label: "Request Body",
        placeholder: '{"name": "{{ extract_1.name }}"}',
        multiline: true,
      },
      {
        key: "timeoutMs",
        label: "Timeout (ms)",
        placeholder: "30000",
      },
    ],
    outputs: [
      { path: "status", label: "Status Code" },
      { path: "ok", label: "Success" },
      { path: "body", label: "Response Body" },
      { path: "headers", label: "Response Headers" },
    ],
  },
  code: {
    type: "code",
    kind: "action",
    label: "Code",
    icon: Code2,
    accent: "bg-amber-500 text-white",
    fields: [
      {
        key: "code",
        label: "JavaScript Code",
        placeholder: "// $input contains the output of the previous node\nreturn $input;",
        monaco: true,
        required: true,
      },
      {
        key: "timeout",
        label: "Timeout (ms)",
        placeholder: "10000",
      },
    ],
    outputs: [
      { path: "result", label: "Return Value" },
      { path: "logs", label: "Console Logs" },
    ],
  },
} satisfies Record<string, NodeDefinition>

export type NodeType = keyof typeof nodeRegistry

// Plain JSON only (synced through Liveblocks later). type keys into the registry;
// kind and title are denormalized so the server can read them without the registry.
export type StepNodeData = {
  type: NodeType
  kind: StepNodeKind
  title: string
  values: Record<string, string>
}

export type StepNodeType = Node<StepNodeData, "step">

export type ActionNodeType = {
  [K in NodeType]: (typeof nodeRegistry)[K]["kind"] extends "action" ? K : never
}[NodeType]