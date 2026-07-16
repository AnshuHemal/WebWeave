"use client"

import { useRef, useTransition } from "react"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { parseImportedWorkflowJson } from "@/features/workflows/lib/import-export"
import { importWorkflowAction } from "@/features/workflows/actions"

export function ImportWorkflowButton({
  className,
  variant = "outline",
}: {
  className?: string
  variant?: "outline" | "default" | "secondary" | "ghost"
}) {
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (!content) return

      try {
        const { name, graph } = parseImportedWorkflowJson(content)
        startTransition(async () => {
          await importWorkflowAction({ name, graph })
          toast.success(`Workflow "${name}" imported successfully!`)
        })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to import workflow JSON")
      }
    }
    reader.readAsText(file)
    // Clear input so selecting the same file again triggers change event
    e.target.value = ""
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant={variant}
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
        className={className}
      >
        <Upload className="size-4 mr-2" />
        {isPending ? "Importing..." : "Import JSON"}
      </Button>
    </>
  )
}
