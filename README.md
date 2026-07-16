<div align="center">

# 🕸️ WebWeave

### *Weave intelligent, production-grade automated workflows visually.*

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" />
  <img src="https://img.shields.io/badge/Stagehand-AI%20Browser-FF6B35?style=for-the-badge" alt="Stagehand" />
  <img src="https://img.shields.io/badge/Trigger.dev-Background%20Jobs-6366F1?style=for-the-badge" alt="Trigger.dev" />
  <img src="https://img.shields.io/badge/Liveblocks-Realtime-E94D73?style=for-the-badge" alt="Liveblocks" />
  <img src="https://img.shields.io/badge/Neon-Postgres-00E699?style=for-the-badge&logo=neon&logoColor=white" alt="Neon" />
  <img src="https://img.shields.io/badge/Monaco-Editor-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Monaco Editor" />
</p>

<p align="center">
  <strong>The collaborative, production-grade visual workflow automation platform.</strong><br/>
  Design workflow graphs, connect intelligent AI browser agents, run custom code scripts, poll APIs, manage secrets, and inspect real-time execution replays — all in a unified visual canvas.
</p>

<br />

```
┌─────────────────────────────────────────────────────────────┐
│  Design workflow graphs on a multiplayer canvas  →          │
│  Search & add nodes via Cmd+K Command Palette  →            │
│  Execute HTTP APIs, AI Browser actions & Sandboxed JS  →    │
│  Manage encrypted credentials & revision history  →         │
│  Watch cloud execution logs & video replays in real-time    │
└─────────────────────────────────────────────────────────────┘
```

</div>

---

## ✨ Key Features

| Category | Feature | Description |
|---|---|---|
| 🗺️ **Visual Canvas** | **ReactFlow & Liveblocks** | Drag-and-drop node graph editor with multiplayer real-time collaboration |
| 🔍 **Quick Navigation** | **Cmd+K Command Palette** | Keyboard-driven fuzzy node search & placement directly into canvas viewport |
| 📜 **Execution History** | **Runs Dashboard (`/runs`)** | Full execution logs, status filters, duration metrics, and 1-click rerun triggers |
| 🔒 **Secrets Vault** | **Credentials (`/credentials`)** | AES-256-GCM encrypted key manager for headers, Bearer tokens, and basic auth |
| 💻 **Custom Code** | **Monaco Code Editor** | Run sandboxed JavaScript transformations with VS Code syntax formatting |
| 🌐 **REST Integration** | **HTTP Request Engine** | Complete REST node supporting GET, POST, PUT, DELETE with custom auth & bodies |
| 📚 **Templates Library** | **Workflow Starter Gallery** | 1-click cloneable production templates for Webhooks, Scraping, & APIs |
| 🏷️ **Documentation** | **Interactive Sticky Notes** | Resizable pastel canvas notes for inline team documentation & annotations |
| 📑 **Revision Control** | **Version History Snapshots** | Automated DB graph snapshots with 1-click version rollback capability |
| 🔄 **Iteration & Logic** | **Loop Node & Error Trigger** | Process items sequentially and catch workflow exceptions with `$error` tokens |
| 📋 **Multi-Node Copy** | **Clipboard Support (`Cmd+C/V`)** | Duplicate nodes and interconnecting edges with position offsets and ID remapping |
| 🤖 **AI Web Automation** | **Stagehand & Browserbase** | Natural-language AI browser scraping (`act`, `extract`, `observe`, `agent`) |

---

## 🏗️ Architecture & Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                               Browser Client                                 │
│                                                                              │
│  ┌──────────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │   ReactFlow Canvas       │  │  Cmd+K Palette /   │  │  Runs Dashboard  │  │
│  │ (Liveblocks Real-time)   │  │  Templates Modal   │  │  & Logs Drawer   │  │
│  └────────────┬─────────────┘  └─────────┬──────────┘  └────────┬─────────┘  │
│               │                          │                      │            │
└───────────────┼──────────────────────────┼──────────────────────┼────────────┘
                │                          │                      │
┌───────────────▼──────────────────────────▼──────────────────────▼────────────┐
│                             Next.js App Router                               │
│                                                                              │
│  Server Actions ──► Clerk Auth ──► Neon Postgres (AES-256 Encrypted Vault)   │
│  /credentials ────► Encrypted Secrets Engine                                 │
│  /runs ───────────► DB Run Records & Re-execution                            │
│  /api/replays ────► Browserbase Cloud HLS Video Proxy                        │
│                                                                              │
└─────────────────────────────────────┬────────────────────────────────────────┘
                                      │  tasks.trigger("run-workflow")
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             Trigger.dev Worker                               │
│                                                                              │
│  runWorkflowTask                                                             │
│    1. Load graph & credentials from Neon DB                                  │
│    2. Toposort nodes & validate dependency graph                             │
│    3. Resolve {{ nodeId.path }} & {{ $error.message }} interpolation tokens  │
│    4. Execute nodes (REST API, Monaco JS Sandbox, Stagehand Cloud Browser)   │
│    5. Publish step progress metadata live → Canvas & Runs inspector           │
│    6. Save execution record in DB & close session                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Node Registry

WebWeave includes a registry-driven collection of specialized workflow nodes:

### ⚡ Triggers
- **Start** — Standard manual execution trigger.
- **Webhook Trigger** — Listens for incoming POST/GET HTTP payloads.
- **Cron Trigger** — Scheduled recurring cron execution.
- **On Error Trigger** — Catches unhandled step exceptions with `{{ $error.message }}` resolution.

### 🛠️ Actions & Integrations
- **HTTP Request** — Makes REST API calls with Bearer/Basic/API Key auth and custom headers.
- **JavaScript Code** — Runs sandboxed custom JS scripts using Monaco Editor.
- **Open URL** — Navigates Stagehand browser to any target URL.
- **Act** — Executes natural-language browser interactions (e.g. *Click "Submit"*).
- **Extract** — Extracts structured data from active web pages using LLMs.
- **Observe** — Inspects interactive elements on web pages.
- **Agent** — Autonomous multi-step AI web browsing agent *(Pro Plan)*.
- **Loop / Iterator** — Sequentially iterates over arrays and JSON lists (`item`, `index`, `total`).
- **If / Else** — Conditional branching based on expressions.
- **Slack Notify** — Sends formatted notification messages to Slack channels.
- **Google Sheets Append** — Appends structured rows to Google Sheets spreadsheets.
- **Send Email** — Delivers automated emails via Resend.
- **Wait** — Delays workflow execution by specified duration.
- **Sticky Note** — Resizable canvas documentation sticky note.

---

## 📁 Repository Structure

```
WebWeave/
├── app/
│   ├── (auth)/                    # Clerk Sign-in / Sign-up routes
│   ├── (dashboard)/
│   │   ├── page.tsx               # Dashboard homepage
│   │   ├── layout.tsx             # Shared navigation sidebar
│   │   ├── credentials/           # Encrypted Secrets Manager page
│   │   ├── runs/                  # Execution History dashboard page
│   │   └── workflows/[id]/        # Visual workflow editor route
│   └── api/
│       ├── liveblocks/            # Real-time collaboration endpoint
│       └── replays/[sessionId]/   # HLS video stream proxy
│
├── features/
│   ├── credentials/               # AES-256-GCM secret actions & components
│   ├── runs/                      # Execution history data access & UI drawer
│   └── workflows/
│       ├── actions.ts             # Server actions (run, import, export, versions)
│       ├── data.ts                # Database query layer (workflows, versions)
│       ├── hooks/
│       │   ├── use-copy-paste.ts  # Canvas Cmd+C / Cmd+V copy-paste hook
│       │   └── use-pro-plan.ts    # Clerk Pro tier authorization hook
│       ├── lib/
│       │   ├── import-export.ts   # JSON graph import/export validator
│       │   ├── interpolate.ts     # {{ token }} & {{ $error }} variable resolver
│       │   ├── templates.ts       # Starter template definitions
│       │   └── validate-graph.ts  # Node & edge topological graph validator
│       ├── nodes/
│       │   ├── node-registry.ts   # Master node manifest (types, icons, schema)
│       │   ├── node-executors.ts  # Node execution handler router
│       │   ├── code.ts            # Sandboxed JS code execution
│       │   └── http-request.ts    # REST HTTP client execution
│       ├── tasks/
│       │   └── run-workflow.ts    # Trigger.dev cloud execution task
│       └── components/
│           ├── canvas.tsx         # ReactFlow visual canvas with multiplayer sync
│           ├── node-command-palette.tsx  # Cmd+K quick node search modal
│           ├── templates-modal.tsx       # Workflow starter gallery modal
│           ├── version-history-drawer.tsx# Revision history & rollback drawer
│           ├── expression-builder.tsx    # Upstream variable popover picker
│           ├── monaco-field.tsx          # Embedded VS Code Monaco editor
│           ├── sticky-note-node.tsx      # Resizable canvas sticky notes
│           └── right-sidebar.tsx         # Node inspector & workflow menu
│
├── lib/
│   ├── crypto.ts                  # AES-256-GCM encryption engine
│   └── db/
│       ├── schema.ts              # Drizzle ORM schema (workflows, credentials, runs, versions)
│       └── index.ts               # Neon serverless Postgres client
│
└── drizzle.config.ts              # Database migration configuration
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v20+
- Accounts for: [Clerk](https://clerk.com), [Neon Postgres](https://neon.tech), [Trigger.dev](https://trigger.dev), [Browserbase](https://browserbase.com), [Liveblocks](https://liveblocks.io), [Resend](https://resend.com)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/AnshuHemal/WebWeave.git
cd WebWeave
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` in the project root:

```env
# Clerk Authentication & Billing
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (Neon Serverless Postgres)
DATABASE_URL=postgresql://...

# Credentials Secret (32-byte AES-256 Encryption Key)
CREDENTIALS_SECRET=your_32_character_secret_key_here

# Trigger.dev Background Task Engine
TRIGGER_SECRET_KEY=tr_dev_...

# Liveblocks Real-time Canvas Sync
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_...
LIVEBLOCKS_SECRET_KEY=sk_dev_...

# Browserbase & Stagehand AI Browser
BROWSERBASE_API_KEY=bb_live_...
BROWSERBASE_PROJECT_ID=...

# Resend Email Delivery
RESEND_API_KEY=re_...
```

### 3. Synchronize Database Schema

```bash
npx drizzle-kit push
```

### 4. Run Development Services

In terminal 1 (Next.js App):
```bash
npm run dev
```

In terminal 2 (Trigger.dev Worker):
```bash
npx trigger.dev@latest dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📜 NPM Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts Next.js development server with Turbopack |
| `npm run build` | Builds production output bundle |
| `npm run typecheck` | Validates TypeScript types (`tsc --noEmit`) |
| `npm run lint` | Runs ESLint analysis |
| `npx drizzle-kit push` | Applies schema migrations directly to Neon Postgres |
| `npx drizzle-kit studio` | Opens Drizzle Studio browser database GUI |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

<div align="center">
  <sub>Built with ❤️ using Next.js 16, Stagehand, Trigger.dev, Liveblocks, and Neon Postgres.</sub>
</div>
