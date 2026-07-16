"use client"

import { useRef, useEffect, useState } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"
import { Code2, Maximize2, Minimize2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonacoFieldProps {
  value: string
  onChange: (value: string) => void
  /** default placeholder inserted when the editor is empty */
  placeholder?: string
  /** height in pixels when collapsed (default 200) */
  defaultHeight?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STARTER = `// $input  → output of the previous node
// return  → output sent to downstream nodes
//
// Example:
//   const items = ($input.body?.results ?? []);
//   return items.map(item => ({ name: item.name, url: item.url }));

return $input;
`

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MonacoField({
  value,
  onChange,
  placeholder = STARTER,
  defaultHeight = 240,
}: MonacoFieldProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const height = isExpanded ? 480 : defaultHeight

  // Insert starter template when the value is empty and user first mounts
  const effectiveValue = value || ""

  function handleMount(editor: Parameters<OnMount>[0]) {
    editorRef.current = editor
    setIsReady(true)

    // Auto-format on mount
    setTimeout(() => {
      editor.getAction("editor.action.formatDocument")?.run()
    }, 300)

    // Ctrl+Shift+F to format
    editor.addCommand(
      // Monaco key codes: Ctrl+Shift+F = 36 (F key) | 2048 (Ctrl) | 1024 (Shift)
      2048 | 1024 | 36,
      () => {
        editor.getAction("editor.action.formatDocument")?.run()
      }
    )
  }

  function handleReset() {
    onChange(placeholder)
    editorRef.current?.setValue(placeholder)
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-[#1e1e2e] transition-all duration-300",
        isExpanded && "shadow-xl shadow-black/30"
      )}
      style={{ height }}
    >
      {/* Header bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-[#181825] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <Code2 className="size-3 text-amber-400" />
          <span className="text-[10px] font-medium text-amber-300/80 tracking-wide">
            JavaScript
          </span>
          <span className="text-[10px] text-white/20">·</span>
          <span className="text-[10px] text-white/30">
            <kbd className="font-mono">Ctrl+Shift+F</kbd> to format
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Reset to template */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to starter template"
            className="flex size-5 items-center justify-center rounded text-white/30 transition-colors hover:bg-white/10 hover:text-amber-300"
          >
            <RotateCcw className="size-3" />
          </button>

          {/* Expand / collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded((p) => !p)}
            title={isExpanded ? "Collapse editor" : "Expand editor"}
            className="flex size-5 items-center justify-center rounded text-white/30 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isExpanded ? (
              <Minimize2 className="size-3" />
            ) : (
              <Maximize2 className="size-3" />
            )}
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="relative flex-1 overflow-hidden">
        {/* Loading skeleton */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-amber-400/50"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={effectiveValue}
          onChange={(val) => onChange(val ?? "")}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            lineNumbers: "on",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            renderLineHighlight: "gutter",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            suggest: { showWords: false },
            padding: { top: 8, bottom: 8 },
            overviewRulerLanes: 0,
            scrollbar: {
              verticalScrollbarSize: 4,
              horizontalScrollbarSize: 4,
            },
          }}
        />
      </div>

      {/* Bottom status bar */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-[#181825] px-3 py-1">
        <span className="text-[10px] text-white/20">
          $input → from previous node · return value → downstream nodes
        </span>
        <div className="flex items-center gap-1">
          <div className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] text-white/20">JS</span>
        </div>
      </div>
    </div>
  )
}
