import type { Edge } from "@xyflow/react"
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import type { StepNodeType } from "@/features/workflows/nodes/node-registry"

// Canonical, server-readable snapshot of the flow. Mirrors React Flow's own
// shape 1:1 so a future executor can read it without remapping. Persisted by the
// Run action; the live editing copy still lives in the Liveblocks room.
export type WorkflowGraph = { nodes: StepNodeType[]; edges: Edge[] }

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  graph: jsonb("graph").$type<WorkflowGraph>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Workflow = typeof workflows.$inferSelect

// ---------------------------------------------------------------------------
// Credentials — securely stored secrets referenced by workflow nodes.
// The `encryptedData` field holds the AES-256-GCM encrypted JSON blob of the
// actual secret values. Only the server can decrypt it using CREDENTIALS_SECRET.
// ---------------------------------------------------------------------------

export type CredentialType = "bearer" | "api-key" | "basic" | "custom"

export const credentials = pgTable("credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  type: text("type").$type<CredentialType>().notNull(),
  // AES-256-GCM encrypted JSON — format: iv:authTag:ciphertext (hex-encoded)
  encryptedData: text("encrypted_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Credential = typeof credentials.$inferSelect

// ---------------------------------------------------------------------------
// Workflow Runs — execution history records for auditing, debugging, & rerun.
// ---------------------------------------------------------------------------

export type RunStatus = "QUEUED" | "EXECUTING" | "COMPLETED" | "FAILED" | "CANCELED"

export const workflowRuns = pgTable("workflow_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull(),
  orgId: text("org_id").notNull(),
  status: text("status").$type<RunStatus>().notNull().default("QUEUED"),
  triggerType: text("trigger_type").notNull().default("manual"), // manual | webhook | cron
  durationMs: text("duration_ms").default("0"),
  error: text("error"),
  steps: jsonb("steps").$type<any[]>(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
})

export type WorkflowRunRecord = typeof workflowRuns.$inferSelect
