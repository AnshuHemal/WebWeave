"use client"

import { useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PlusIcon, WorkflowIcon } from "lucide-react"

import { generateSlug } from "@/features/workflows/lib/generate-slug"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import type { Workflow } from "@/lib/db/schema"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { ImportWorkflowButton } from "@/features/workflows/components/import-workflow-button"
import { TemplatesModal } from "@/features/workflows/components/templates-modal"
import { Button } from "@/components/ui/button"

interface WorkflowNavProps {
  workflows: Workflow[]
  onCreateWorkflow: (name: string) => Promise<void>
}

export function WorkflowNav({ workflows, onCreateWorkflow }: WorkflowNavProps) {
  const { state } = useSidebar()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [showTemplates, setShowTemplates] = useState(false)

  const handleCreateWorkflow = () => {
    startTransition(async () => {
      await onCreateWorkflow(generateSlug())
    })
  }

  const workflowItems = workflows.map((workflow) => (
    <SidebarMenuItem key={workflow.id}>
      <SidebarMenuButton
        asChild
        isActive={pathname === `/workflows/${workflow.id}`}
      >
        <Link href={`/workflows/${workflow.id}`}>
          <span>{workflow.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ))

  if (state === "collapsed") {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Popover>
                <PopoverTrigger asChild>
                  <SidebarMenuButton tooltip="Workflows">
                    <WorkflowIcon />
                    <span>Workflows</span>
                  </SidebarMenuButton>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="p-1 space-y-1">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={handleCreateWorkflow}
                        disabled={isPending}
                      >
                        <PlusIcon />
                        <span>New workflow</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                  <div className="px-1 py-1 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplates(true)}
                      className="w-full justify-start text-xs h-7 text-blue-400 gap-1.5"
                    >
                      <Sparkles className="size-3.5 text-blue-400" />
                      <span>Templates</span>
                    </Button>
                    <ImportWorkflowButton variant="outline" className="w-full text-xs h-7" />
                  </div>
                  <SidebarSeparator className="mx-0" />
                  <SidebarMenu className="gap-y-0.5">{workflowItems}</SidebarMenu>
                </PopoverContent>
              </Popover>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
        <TemplatesModal open={showTemplates} onOpenChange={setShowTemplates} />
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workflows</SidebarGroupLabel>
      <SidebarGroupAction
        title="New workflow"
        onClick={handleCreateWorkflow}
        disabled={isPending}
      >
        <PlusIcon />
        <span className="sr-only">New workflow</span>
      </SidebarGroupAction>
      <SidebarGroupContent className="space-y-1.5">
        <div className="px-2 pt-1 flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(true)}
            className="w-full justify-start text-xs h-7 border-dashed border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-1.5"
          >
            <Sparkles className="size-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Browse Templates</span>
          </Button>
          <ImportWorkflowButton variant="outline" className="w-full text-xs h-7 border-dashed border-border text-muted-foreground hover:text-foreground" />
        </div>
        <SidebarMenu className="gap-y-0.5">{workflowItems}</SidebarMenu>
      </SidebarGroupContent>
      <TemplatesModal open={showTemplates} onOpenChange={setShowTemplates} />
    </SidebarGroup>
  )
}
