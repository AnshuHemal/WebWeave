"use client"

import { useState } from "react"
import { useThreads, useCreateThread } from "@liveblocks/react/suspense"
import { Thread, Composer } from "@liveblocks/react-ui"
import { MessageSquare, X } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface NodeCommentsProps {
  nodeId: string
}

export function NodeComments({ nodeId }: NodeCommentsProps) {
  const { threads } = useThreads()
  const createThread = useCreateThread()
  const [isOpen, setIsOpen] = useState(false)

  // Filter threads that belong to this node
  const activeThreads = threads.filter(
    (t) => t.metadata.nodeId === nodeId
  )

  const commentCount = activeThreads.length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute -top-3.5 -right-2 flex size-6 items-center justify-center rounded-full border border-blue-200 bg-blue-600 text-[10px] font-bold text-white shadow-sm hover:scale-105 hover:bg-blue-700 transition-all cursor-pointer"
          title="Node Comments"
        >
          {commentCount > 0 ? (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="size-2.5 fill-white" />
              {commentCount}
            </span>
          ) : (
            <MessageSquare className="size-3" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-80 p-0 shadow-lg border border-border rounded-lg bg-card text-card-foreground overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-muted/40">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="size-3.5 text-violet-600" />
            Comments & Discussion
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 rounded-md hover:bg-border/60"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-3" />
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-border">
          {activeThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
              <p>No comments on this node yet.</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                Start a thread to ask a question or leave notes.
              </p>
            </div>
          ) : (
            activeThreads.map((thread) => (
              <div key={thread.id} className="p-1">
                <Thread thread={thread} className="border-0 shadow-none text-xs bg-transparent" />
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border p-2 bg-muted/10">
          <Composer
            className="text-xs border-0 bg-transparent shadow-none"
            onComposerSubmit={({ body }, event) => {
              event?.preventDefault()
              createThread({
                body,
                metadata: { nodeId },
              })
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
