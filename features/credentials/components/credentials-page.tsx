"use client"

import { useState, useTransition } from "react"
import {
  Key,
  Plus,
  Trash2,
  ShieldCheck,
  Lock,
  User,
  Code2,
  ChevronDown,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createCredentialAction,
  deleteCredentialAction,
  type CredentialListItem,
} from "@/features/credentials/actions"
import type { CredentialType } from "@/lib/db/schema"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Type metadata
// ---------------------------------------------------------------------------

const CREDENTIAL_TYPES: {
  value: CredentialType
  label: string
  description: string
  icon: React.ReactNode
  accent: string
}[] = [
  {
    value: "bearer",
    label: "Bearer Token",
    description: "Authorization: Bearer <token>",
    icon: <ShieldCheck className="size-4" />,
    accent: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  {
    value: "api-key",
    label: "API Key",
    description: "Custom header or query param",
    icon: <Key className="size-4" />,
    accent: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  {
    value: "basic",
    label: "Basic Auth",
    description: "Username + Password",
    icon: <User className="size-4" />,
    accent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Key/value pairs of your choice",
    icon: <Code2 className="size-4" />,
    accent: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  },
]

function typeInfo(type: CredentialType) {
  return CREDENTIAL_TYPES.find((t) => t.value === type)!
}

// ---------------------------------------------------------------------------
// New Credential Dialog
// ---------------------------------------------------------------------------

function NewCredentialDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<CredentialType>("bearer")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Field state per type
  const [bearerToken, setBearerToken] = useState("")
  const [apiKeyName, setApiKeyName] = useState("")
  const [apiKeyValue, setApiKeyValue] = useState("")
  const [basicUsername, setBasicUsername] = useState("")
  const [basicPassword, setBasicPassword] = useState("")
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ])

  function reset() {
    setName("")
    setType("bearer")
    setBearerToken("")
    setApiKeyName("")
    setApiKeyValue("")
    setBasicUsername("")
    setBasicPassword("")
    setCustomFields([{ key: "", value: "" }])
    setShowPassword(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Credential name is required")
      return
    }

    let data: Parameters<typeof createCredentialAction>[0]["data"]

    if (type === "bearer") {
      if (!bearerToken.trim()) return toast.error("Token is required")
      data = { type: "bearer", token: bearerToken }
    } else if (type === "api-key") {
      if (!apiKeyName.trim() || !apiKeyValue.trim())
        return toast.error("Key name and value are required")
      data = { type: "api-key", keyName: apiKeyName, keyValue: apiKeyValue }
    } else if (type === "basic") {
      if (!basicUsername.trim() || !basicPassword.trim())
        return toast.error("Username and password are required")
      data = { type: "basic", username: basicUsername, password: basicPassword }
    } else {
      const fields: Record<string, string> = {}
      for (const { key, value } of customFields) {
        if (key.trim()) fields[key.trim()] = value
      }
      if (Object.keys(fields).length === 0) return toast.error("Add at least one field")
      data = { type: "custom", fields }
    }

    startTransition(async () => {
      try {
        await createCredentialAction({ name: name.trim(), type, data })
        toast.success(`Credential "${name}" created`)
        reset()
        onCreated()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create credential")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Lock className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base">New Credential</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Encrypted at rest with AES-256-GCM. Never stored as plaintext.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Credential Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="My Slack API Key"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Type selector */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CredentialType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CREDENTIAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      {t.icon}
                      <span>{t.label}</span>
                      <span className="text-xs text-muted-foreground">— {t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic fields per type */}
          {type === "bearer" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Token <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="sk-..."
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          {type === "api-key" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Header / Param Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="X-API-Key"
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Key Value <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={apiKeyValue}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {type === "basic" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Username <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="admin"
                  value={basicUsername}
                  onChange={(e) => setBasicUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={basicPassword}
                    onChange={(e) => setBasicPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {type === "custom" && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs">Fields</Label>
              {customFields.map((field, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Key"
                    value={field.key}
                    onChange={(e) => {
                      const updated = [...customFields]
                      updated[i] = { ...updated[i], key: e.target.value }
                      setCustomFields(updated)
                    }}
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => {
                      const updated = [...customFields]
                      updated[i] = { ...updated[i], value: e.target.value }
                      setCustomFields(updated)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomFields(customFields.filter((_, j) => j !== i))}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  {showPassword ? "Hide values" : "Show values"}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomFields([...customFields, { key: "", value: "" }])}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <Plus className="size-3" />
                  Add field
                </button>
              </div>
            </div>
          )}

          {/* Encryption notice */}
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <p className="text-xs text-emerald-300/80 leading-relaxed">
              This credential will be encrypted with AES-256-GCM before being stored.
              The raw value is never saved to the database.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-500/20"
            >
              {isPending ? "Saving…" : "Save Credential"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Credential Card
// ---------------------------------------------------------------------------

function CredentialCard({
  credential,
  onDeleted,
}: {
  credential: CredentialListItem
  onDeleted: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const info = typeInfo(credential.type)

  function handleCopyId() {
    navigator.clipboard.writeText(credential.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDelete() {
    if (!confirm(`Delete "${credential.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteCredentialAction(credential.id)
        toast.success(`Deleted "${credential.name}"`)
        onDeleted()
      } catch {
        toast.error("Failed to delete credential")
      }
    })
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200",
        "hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-0.5"
      )}
    >
      {/* Type icon chip */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg border",
          info.accent
        )}
      >
        {info.icon}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{credential.name}</p>
          <span
            className={cn(
              "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              info.accent
            )}
          >
            {info.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] text-muted-foreground truncate">
            ID: {credential.id}
          </p>
          <button
            type="button"
            onClick={handleCopyId}
            title="Copy credential ID"
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            {copied ? (
              <Check className="size-3 text-emerald-400" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/60">
          Created {format(new Date(credential.createdAt), "MMM d, yyyy")}
        </p>
      </div>

      {/* Encrypted badge */}
      <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground/50">
        <Lock className="size-3" />
        <span className="text-[10px]">Encrypted</span>
      </div>

      {/* Delete */}
      <Button
        size="icon"
        variant="ghost"
        disabled={isPending}
        onClick={handleDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main credentials page component
// ---------------------------------------------------------------------------

export function CredentialsPage({
  initialCredentials,
}: {
  initialCredentials: CredentialListItem[]
}) {
  const [items, setItems] = useState(initialCredentials)
  const [showNew, setShowNew] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function refresh() {
    window.location.reload()
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 overflow-y-auto max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Credentials
          </h2>
          <p className="text-muted-foreground">
            Securely store API keys, tokens, and passwords. All values are AES-256-GCM encrypted.
          </p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2 font-medium shadow-lg shadow-cyan-500/20"
        >
          <Plus className="size-4" />
          New Credential
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Key className="size-8" />
            </div>
            <h3 className="mb-2 text-base font-semibold">No credentials yet</h3>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              Store your API keys and tokens here. Reference them in your workflow nodes without hardcoding secrets.
            </p>
            <Button
              onClick={() => setShowNew(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2 font-medium shadow-md shadow-cyan-500/20"
            >
              <Plus className="size-4" />
              Add your first credential
            </Button>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing <strong className="text-foreground">{items.length}</strong> credential{items.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-medium">
                <ShieldCheck className="size-3.5" />
                <span>AES-256-GCM Encrypted</span>
              </div>
            </div>

            {/* Credential list grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((cred) => (
                <CredentialCard
                  key={cred.id}
                  credential={cred}
                  onDeleted={refresh}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <NewCredentialDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={refresh}
      />
    </div>
  )
}
