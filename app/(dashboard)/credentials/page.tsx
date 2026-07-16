import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { listCredentialsAction } from "@/features/credentials/actions"
import { CredentialsPage } from "@/features/credentials/components/credentials-page"

export const metadata = {
  title: "Credentials — WebWeave",
  description: "Manage encrypted API keys, tokens, and secrets for your workflow nodes.",
}

export default async function Page() {
  const { orgId } = await auth()
  if (!orgId) redirect("/sign-in")

  const credentials = await listCredentialsAction()

  return <CredentialsPage initialCredentials={credentials} />
}
