import type { Node } from "@xyflow/react"
import {
  Bot,
  Clock,
  Eye,
  GitFork,
  Globe,
  Mail,
  MousePointerClick,
  Pointer,
  ScanText,
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
    accent: "bg-violet-500 text-white",
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