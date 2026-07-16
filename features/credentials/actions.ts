"use server"

import { auth } from "@clerk/nextjs/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { credentials } from "@/lib/db/schema"
import { encrypt, decrypt } from "@/lib/crypto"
import type { CredentialType } from "@/lib/db/schema"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CredentialData =
  | { type: "bearer"; token: string }
  | { type: "api-key"; keyName: string; keyValue: string }
  | { type: "basic"; username: string; password: string }
  | { type: "custom"; fields: Record<string, string> }

export type CredentialListItem = {
  id: string
  name: string
  type: CredentialType
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrgId(): Promise<string> {
  const { orgId } = await auth()
  if (!orgId) throw new Error("No active organization")
  return orgId
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Create a new encrypted credential record */
export async function createCredentialAction(input: {
  name: string
  type: CredentialType
  data: CredentialData
}) {
  const orgId = await getOrgId()

  if (!input.name.trim()) throw new Error("Credential name is required")

  const encryptedData = encrypt(input.data)

  await db.insert(credentials).values({
    orgId,
    name: input.name.trim(),
    type: input.type,
    encryptedData,
  })

  revalidatePath("/credentials")
}

/** List all credentials for the current org (without decrypting data) */
export async function listCredentialsAction(): Promise<CredentialListItem[]> {
  const orgId = await getOrgId()

  const rows = await db
    .select({
      id: credentials.id,
      name: credentials.name,
      type: credentials.type,
      createdAt: credentials.createdAt,
      updatedAt: credentials.updatedAt,
    })
    .from(credentials)
    .where(eq(credentials.orgId, orgId))
    .orderBy(credentials.createdAt)

  return rows
}

/** Delete a credential by ID (org-scoped) */
export async function deleteCredentialAction(id: string) {
  const orgId = await getOrgId()

  await db
    .delete(credentials)
    .where(and(eq(credentials.id, id), eq(credentials.orgId, orgId)))

  revalidatePath("/credentials")
}

/**
 * Decrypt a credential's data — used only server-side by node executors.
 * Never expose decrypted data to the client.
 */
export async function getDecryptedCredential(id: string): Promise<CredentialData> {
  const orgId = await getOrgId()

  const [row] = await db
    .select({ encryptedData: credentials.encryptedData })
    .from(credentials)
    .where(and(eq(credentials.id, id), eq(credentials.orgId, orgId)))

  if (!row) throw new Error(`Credential ${id} not found`)

  return decrypt<CredentialData>(row.encryptedData)
}
