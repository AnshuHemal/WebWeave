import type { WorkflowGraph } from "@/lib/db/schema"

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: "Webhooks" | "Scraping" | "Integrations" | "APIs"
  tags: string[]
  icon: string
  graph: WorkflowGraph
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "webhook-to-slack",
    name: "Webhook Notifier for Slack",
    description: "Receive inbound JSON webhooks and send formatted alerts directly to Slack channels.",
    category: "Webhooks",
    tags: ["Webhook", "Slack", "Notifications"],
    icon: "Webhook",
    graph: {
      nodes: [
        {
          id: "webhook_trigger_1",
          type: "step",
          position: { x: 100, y: 150 },
          data: {
            type: "webhook-trigger",
            kind: "trigger",
            title: "Webhook Trigger",
            values: { path: "slack-incoming" },
          },
        },
        {
          id: "slack_notify_1",
          type: "step",
          position: { x: 450, y: 150 },
          data: {
            type: "slack-notify",
            kind: "action",
            title: "Send Slack Notification",
            values: {
              channel: "#general",
              message: "Incoming Webhook Received: {{ webhook_trigger_1.body }}",
            },
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "webhook_trigger_1",
          target: "slack_notify_1",
          type: "smoothstep",
        },
      ],
    },
  },
  {
    id: "web-scraper-sheets",
    name: "Web Scraper & Google Sheets Export",
    description: "Navigate to a target website, extract headings or data tables, and append rows into Google Sheets.",
    category: "Scraping",
    tags: ["Browser", "Scraping", "Google Sheets"],
    icon: "Globe",
    graph: {
      nodes: [
        {
          id: "start",
          type: "step",
          position: { x: 0, y: 150 },
          data: {
            type: "start",
            kind: "trigger",
            title: "Start",
            values: {},
          },
        },
        {
          id: "open_url_1",
          type: "step",
          position: { x: 300, y: 150 },
          data: {
            type: "open-url",
            kind: "action",
            title: "Open target page",
            values: { url: "https://news.ycombinator.com" },
          },
        },
        {
          id: "extract_1",
          type: "step",
          position: { x: 620, y: 150 },
          data: {
            type: "extract",
            kind: "action",
            title: "Extract headlines",
            values: {
              instruction: "Extract the top 5 article titles and links",
            },
          },
        },
        {
          id: "sheets_append_1",
          type: "step",
          position: { x: 940, y: 150 },
          data: {
            type: "sheets-append",
            kind: "action",
            title: "Append to Google Sheets",
            values: {
              spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
              range: "Sheet1!A1",
              valuesJson: "{{ extract_1.data }}",
            },
          },
        },
      ],
      edges: [
        { id: "e0", source: "start", target: "open_url_1", type: "smoothstep" },
        { id: "e1", source: "open_url_1", target: "extract_1", type: "smoothstep" },
        { id: "e2", source: "extract_1", target: "sheets_append_1", type: "smoothstep" },
      ],
    },
  },
  {
    id: "rest-api-transform",
    name: "REST API Data Transformer",
    description: "Fetch JSON from an external REST API, run custom JavaScript transformation, and output clean data.",
    category: "APIs",
    tags: ["HTTP", "JavaScript", "Code"],
    icon: "Code2",
    graph: {
      nodes: [
        {
          id: "start",
          type: "step",
          position: { x: 0, y: 150 },
          data: {
            type: "start",
            kind: "trigger",
            title: "Start",
            values: {},
          },
        },
        {
          id: "http_request_1",
          type: "step",
          position: { x: 300, y: 150 },
          data: {
            type: "http-request",
            kind: "action",
            title: "Fetch API Endpoint",
            values: {
              url: "https://jsonplaceholder.typicode.com/posts/1",
              method: "GET",
            },
          },
        },
        {
          id: "code_1",
          type: "step",
          position: { x: 650, y: 150 },
          data: {
            type: "code",
            kind: "action",
            title: "Transform JSON Payload",
            values: {
              code: "// Transform the HTTP response\nconst data = $input;\nreturn {\n  title: data.title,\n  length: data.body ? data.body.length : 0,\n  processedAt: new Date().toISOString()\n};",
            },
          },
        },
      ],
      edges: [
        { id: "e0", source: "start", target: "http_request_1", type: "smoothstep" },
        { id: "e1", source: "http_request_1", target: "code_1", type: "smoothstep" },
      ],
    },
  },
]
