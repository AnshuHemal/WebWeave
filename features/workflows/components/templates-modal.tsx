"use client"

import { useState, useTransition } from "react"
import { Sparkles, ArrowRight, Layers, Check, Search } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { WORKFLOW_TEMPLATES, type WorkflowTemplate } from "@/features/workflows/lib/templates"
import { importWorkflowAction } from "@/features/workflows/actions"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { cn } from "@/lib/utils"

export function TemplatesModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [category, setCategory] = useState<string>("ALL")
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  const categories = ["ALL", "Webhooks", "Scraping", "APIs"]

  const filteredTemplates = WORKFLOW_TEMPLATES.filter((t) => {
    const matchesCat = category === "ALL" || t.category === category
    const matchesSearch =
      search === "" ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    return matchesCat && matchesSearch
  })

  function handleUseTemplate(template: WorkflowTemplate) {
    startTransition(async () => {
      try {
        await importWorkflowAction({
          name: template.name,
          graph: template.graph,
        })
        toast.success(`Created workflow from template: "${template.name}"`)
        onOpenChange(false)
      } catch (err) {
        // Next.js redirect throws a NEXT_REDIRECT error under the hood; rethrow it so Next.js handles the routing.
        if (err instanceof Error && (err.message === "NEXT_REDIRECT" || (err as any).digest?.startsWith("NEXT_REDIRECT"))) {
          onOpenChange(false)
          throw err
        }
        toast.error("Failed to create workflow from template")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-none sm:w-[90vw] sm:max-w-6xl max-h-[85vh] h-auto bg-card border-border p-0 overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Workflow Templates Library</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Start faster with pre-built production templates for webhooks, scraping, and REST APIs.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-border bg-muted/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                type="button"
                variant={category === cat ? "default" : "ghost"}
                size="sm"
                onClick={() => setCategory(cat)}
                className={cn(
                  "h-8 text-xs rounded-lg px-3.5 font-medium",
                  category === cat
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search templates & integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs pl-9 bg-card border-border"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group flex flex-col justify-between h-full rounded-xl border border-border bg-card/60 p-5 transition-all duration-200 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5"
            >
              <div className="flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2 min-h-[44px]">
                  <h3 className="font-semibold text-sm group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                    {template.name}
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-medium border-border shrink-0 mt-0.5">
                    {template.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 min-h-[36px] line-clamp-2">
                  {template.description}
                </p>

                {/* Node flow visualization chips */}
                <div className="flex items-center gap-1.5 mb-4 flex-wrap bg-muted/40 p-2.5 rounded-lg border border-border/60 min-h-[76px] content-start">
                  {template.graph.nodes.map((node, i) => (
                    <div key={node.id} className="flex items-center gap-1">
                      <div className="flex items-center gap-1 bg-card border border-border px-1.5 py-0.5 rounded text-[10px] text-foreground font-medium">
                        <NodeIcon type={node.data.type} className="size-3 text-blue-400" />
                        <span className="truncate max-w-[100px]">{node.data.title}</span>
                      </div>
                      {i < template.graph.nodes.length - 1 && (
                        <ArrowRight className="size-2.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40 mt-auto">
                <div className="flex items-center gap-1 flex-wrap max-w-[55%]">
                  {template.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-muted-foreground/70 font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleUseTemplate(template)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-7 gap-1.5 shrink-0 shadow-sm shadow-blue-500/20"
                >
                  <span>Use Template</span>
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
