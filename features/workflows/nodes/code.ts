/**
 * code node executor
 *
 * Runs user-authored JavaScript in a sandboxed Node.js vm context.
 * The user's code receives:
 *   - $input  : the output of the immediately upstream node
 *   - $env    : safe subset of process.env (no secrets)
 *   - console : scoped logger that captures output
 *
 * The code must either `return` a value or export one as the last expression.
 * Whatever is returned becomes this node's output, available to downstream
 * nodes as {{ code_1.result }}.
 *
 * Example code a user might write:
 *   const items = $input.body.results ?? [];
 *   return items.map(item => ({ name: item.name, url: item.url }));
 */

import vm from "node:vm"

export type CodeValues = {
  code: string
  timeout?: string
}

export async function codeNode({
  code,
  timeout = "10000",
  input,
}: CodeValues & { input?: unknown }): Promise<{ result: unknown; logs: string[] }> {
  if (!code?.trim()) {
    throw new Error("Code node: code field is empty")
  }

  const logs: string[] = []
  const timeoutMs = Math.min(Number(timeout) || 10000, 30000)

  // Minimal safe console shim — captures logs without leaking process stdout
  const safeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    warn: (...args: unknown[]) => logs.push(`[WARN] ${args.map(String).join(" ")}`),
    error: (...args: unknown[]) => logs.push(`[ERROR] ${args.map(String).join(" ")}`),
    info: (...args: unknown[]) => logs.push(`[INFO] ${args.map(String).join(" ")}`),
  }

  // Wrap the user's code in an async IIFE so they can use `await` and `return`
  const wrappedCode = `
(async function() {
  ${code}
})()
`

  const context = vm.createContext({
    $input: input ?? {},
    console: safeConsole,
    JSON,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Promise,
    setTimeout,
    clearTimeout,
    // Expose a clean subset of globals; block fs, process, require, etc.
  })

  let result: unknown
  try {
    result = await vm.runInContext(wrappedCode, context, {
      timeout: timeoutMs,
      displayErrors: true,
    })
  } catch (err: any) {
    if (err?.code === "ERR_SCRIPT_EXECUTION_TIMEOUT") {
      throw new Error(`Code node: execution timed out after ${timeoutMs}ms`)
    }
    throw new Error(`Code node: ${err?.message ?? String(err)}`)
  }

  return { result, logs }
}
