"use client"

import { useState } from "react"
import { NodeProps, NodeResizer } from "@xyflow/react"
import { Pin, Trash2, StickyNote as StickyIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type StickyColor = "amber" | "blue" | "emerald" | "rose" | "violet"

export type StickyNodeData = {
  text?: string
  color?: StickyColor
}

const COLOR_MAP: Record<StickyColor, { bg: string; border: string; text: string; pin: string }> = {
  amber: {
    bg: "bg-amber-500/10 dark:bg-amber-950/30",
    border: "border-amber-500/30",
    text: "text-amber-200",
    pin: "text-amber-400",
  },
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-950/30",
    border: "border-blue-500/30",
    text: "text-blue-200",
    pin: "text-blue-400",
  },
  emerald: {
    bg: "bg-emerald-500/10 dark:bg-emerald-950/30",
    border: "border-emerald-500/30",
    text: "text-emerald-200",
    pin: "text-emerald-400",
  },
  rose: {
    bg: "bg-rose-500/10 dark:bg-rose-950/30",
    border: "border-rose-500/30",
    text: "text-rose-200",
    pin: "text-rose-400",
  },
  violet: {
    bg: "bg-violet-500/10 dark:bg-violet-950/30",
    border: "border-violet-500/30",
    text: "text-violet-200",
    pin: "text-violet-400",
  },
}

export function StickyNoteNode({ id, data, selected }: any) {
  const [text, setText] = useState<string>(data?.text || "Add note or workflow documentation here...")
  const colorKey: StickyColor = (data?.color as StickyColor) || "amber"
  const theme = COLOR_MAP[colorKey] || COLOR_MAP.amber

  return (
    <div
      className={cn(
        "group relative flex size-full min-h-[140px] min-w-[200px] flex-col rounded-xl border p-3 shadow-md backdrop-blur-md transition-all",
        theme.bg,
        theme.border,
        selected && "ring-2 ring-blue-500 shadow-lg shadow-black/20"
      )}
    >
      <NodeResizer
        minWidth={180}
        minHeight={120}
        isVisible={selected}
        lineClassName="border-blue-500"
        handleClassName="size-2.5 bg-blue-500 border-2 border-background rounded-full"
      />

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2 drag-handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5">
          <Pin className={cn("size-3.5 rotate-45", theme.pin)} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sticky Note
          </span>
        </div>
      </div>

      {/* Editable Text Body */}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          data.text = e.target.value
        }}
        placeholder="Type documentation notes..."
        className={cn(
          "w-full flex-1 resize-none bg-transparent text-xs leading-relaxed focus:outline-none placeholder:text-muted-foreground/50 font-sans",
          theme.text
        )}
      />
    </div>
  )
}
