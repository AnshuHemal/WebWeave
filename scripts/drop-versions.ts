import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  await sql`DROP TABLE IF EXISTS workflow_versions CASCADE;`
  console.log("SUCCESS: Dropped workflow_versions table.")
}

main().catch(console.error)
