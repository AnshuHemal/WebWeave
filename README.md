<div align="center">

# 🕸️ WebWeave

### *Weave intelligent browser workflows, visually.*

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" />
  <img src="https://img.shields.io/badge/Stagehand-AI%20Browser-FF6B35?style=for-the-badge" alt="Stagehand" />
  <img src="https://img.shields.io/badge/Trigger.dev-Background%20Jobs-6366F1?style=for-the-badge" alt="Trigger.dev" />
  <img src="https://img.shields.io/badge/Liveblocks-Realtime-E94D73?style=for-the-badge" alt="Liveblocks" />
  <img src="https://img.shields.io/badge/Neon-Postgres-00E699?style=for-the-badge&logo=neon&logoColor=white" alt="Neon" />
</p>

<p align="center">
  <strong>The collaborative, AI-powered browser automation platform.</strong><br/>
  Design visual workflows, connect intelligent nodes, and let WebWeave browse, extract, act, and email — without writing a single line of scraper code.
</p>

<br />

```
┌──────────────────────────────────────────────────────┐
│  Design a workflow on a live canvas  →               │
│  Connect nodes (Open URL, Act, Extract, Agent…)  →  │
│  Run it in the cloud  →                              │
│  Watch it execute in real-time  →                    │
│  Replay the browser session as a video               │
└──────────────────────────────────────────────────────┘
```

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Visual Canvas** | Drag-and-drop node-based workflow editor powered by ReactFlow |
| 👥 **Real-time Collaboration** | Multiple users can edit the same workflow simultaneously via Liveblocks |
| 🤖 **AI Browser Automation** | Uses Stagehand (Browserbase) with Gemini 2.5 Flash to understand natural-language instructions |
| ⚡ **Background Execution** | Workflows run durably in the cloud via Trigger.dev — never blocked by your browser |
| 📹 **Session Replay** | Watch a video recording of every browser session using Browserbase's HLS replay |
| 📊 **Live Run Console** | See per-step status (pending → running → done/failed) and duration in real time |
| 🔒 **Org-based Auth** | Each organization has isolated workflows, enforced by Clerk |
| 💳 **Pro Billing** | The Agent node is gated behind a Pro plan via Clerk Billing |
| 📧 **Email Actions** | Send automated emails from within a workflow using Resend |
| 🔍 **Error Monitoring** | Sentry integration with structured logs and source map uploads |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser (User)                                 │
│                                                                         │
│   ┌─────────────────────────┐   ┌──────────────────────────────────┐   │
│   │    ReactFlow Canvas     │   │    Run Console / Logs Panel      │   │
│   │  (Liveblocks real-time) │   │  (Trigger.dev Realtime metadata) │   │
│   └────────────┬────────────┘   └────────────────┬─────────────────┘   │
│                │                                  │                     │
└────────────────┼──────────────────────────────────┼─────────────────────┘
                 │                                  │
┌────────────────▼──────────────────────────────────▼─────────────────────┐
│                          Next.js App Router                             │
│                                                                         │
│  Server Actions ──► Clerk Auth ──► Neon Postgres (Drizzle ORM)         │
│  /api/liveblocks ──────────────────────────────────────────────────►   │
│  /api/replays/[sessionId] ──► Browserbase Observability API            │
│                                                                         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │  tasks.trigger("run-workflow")
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Trigger.dev Worker                                │
│                                                                         │
│  run-workflow task                                                      │
│    1. Load graph from Neon DB                                           │
│    2. Topological sort nodes                                            │
│    3. Walk nodes → interpolate {{ refs }} → execute                     │
│    4. Open lazy Stagehand session (Browserbase cloud browser)           │
│    5. Publish live step metadata → canvas reads it                      │
│    6. Return { steps, browserbaseSessionId }                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Workflow Nodes

These are the building blocks you can connect on the canvas:

| Node | Icon Color | What it does |
|---|---|---|
| **Start** | 🔵 Blue | Trigger node — every workflow starts here |
| **Open URL** | 🟢 Emerald | Navigate the browser to a URL |
| **Act** | 🟣 Violet | Perform a natural-language browser action (click, type, etc.) |
| **Extract** | 🟡 Amber | Extract structured data from the current page |
| **Observe** | 🩵 Sky | Identify interactive elements without clicking them |
| **Agent** | 🔴 Rose | Autonomous multi-step AI agent *(Pro plan only)* |
| **Send Email** | 🩵 Teal | Send an email via Resend |

Nodes are **output-aware**: each node exposes typed outputs (e.g. `url`, `title`, `extraction`) that downstream nodes can reference using `{{ nodeId.path }}` template syntax.

---

## 📁 Project Structure

```
browser-automation-app/
├── app/
│   ├── (auth)/                    # Clerk sign-in / sign-up pages
│   ├── (dashboard)/
│   │   ├── page.tsx               # Home dashboard
│   │   ├── layout.tsx             # Sidebar layout
│   │   ├── billing/               # Clerk Billing / subscription
│   │   └── workflows/[id]/        # Per-workflow canvas page
│   ├── api/
│   │   ├── liveblocks/            # Liveblocks auth endpoint
│   │   └── replays/[sessionId]/   # Browserbase HLS replay proxy
│   ├── layout.tsx                 # Root layout (ClerkProvider, ThemeProvider)
│   └── globals.css                # Design tokens, Tailwind base
│
├── features/workflows/
│   ├── actions.ts                 # Server Actions (create, delete, run, cancel)
│   ├── data.ts                    # DB queries (list, get, save, create, delete)
│   ├── nodes/
│   │   ├── node-registry.ts       # Node manifest: type, label, icon, fields, outputs
│   │   ├── node-executors.ts      # Maps node type → executor function
│   │   ├── open-url.ts            # Executor: navigate to URL
│   │   ├── act.ts                 # Executor: Stagehand act()
│   │   ├── extract.ts             # Executor: Stagehand extract()
│   │   ├── observe.ts             # Executor: Stagehand observe()
│   │   ├── agent.ts               # Executor: Stagehand agent()
│   │   └── send-email.ts          # Executor: Resend email
│   ├── tasks/
│   │   └── run-workflow.ts        # Trigger.dev background task
│   ├── lib/
│   │   └── interpolate.ts         # {{ nodeId.path }} template resolver
│   └── components/
│       ├── canvas.tsx             # ReactFlow canvas wrapper
│       ├── step-node.tsx          # Custom canvas node component
│       ├── right-sidebar.tsx      # Node inspector / field editor
│       ├── logs-panel.tsx         # Per-step run log with status
│       ├── console-panel.tsx      # Run metadata & output viewer
│       ├── session-replay.tsx     # Browserbase HLS video player
│       ├── workflow-nav.tsx       # Sidebar workflow list + create
│       └── workflow-runs-provider.tsx  # Trigger.dev realtime hook
│
├── components/
│   ├── app-sidebar.tsx            # App shell sidebar (Org switcher, UserButton)
│   └── ui/                        # shadcn/ui component library
│
├── lib/
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema (workflows table)
│   │   └── index.ts               # Neon DB connection
│   ├── browserbase.ts             # Browserbase SDK client
│   ├── liveblocks.ts              # Liveblocks client
│   ├── resend.ts                  # Resend email client
│   └── utils.ts                   # cn() and other utilities
│
├── proxy.ts                       # Clerk middleware (auth guard + matchers)
├── trigger.config.ts              # Trigger.dev configuration
├── drizzle.config.ts              # Drizzle Kit configuration
└── next.config.ts                 # Next.js + Sentry configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** / pnpm / yarn
- Accounts for: [Clerk](https://clerk.com), [Neon](https://neon.tech), [Browserbase](https://browserbase.com), [Trigger.dev](https://trigger.dev), [Liveblocks](https://liveblocks.io), [Resend](https://resend.com)

### 1. Clone & Install

```bash
git clone https://github.com/AnshuHemal/WebWeave.git
cd WebWeave
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Neon Serverless Postgres
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...
NEON_BRANCH=main

# Trigger.dev (Background Tasks)
TRIGGER_SECRET_KEY=tr_dev_...

# Liveblocks (Real-time Collaboration)
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_...
LIVEBLOCKS_SECRET_KEY=sk_dev_...

# Browserbase (Cloud Browser)
BROWSERBASE_API_KEY=bb_live_...

# Resend (Email)
RESEND_API_KEY=re_...

# Sentry (Error Monitoring)
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=sntrys_...
```

### 3. Push Database Schema

```bash
npm run db:push
```

### 4. Start Development Servers

In one terminal, start Next.js:

```bash
npm run dev
```

In a second terminal, start the Trigger.dev worker:

```bash
npx trigger.dev@latest dev
```

Your app is now running at **[http://localhost:3000](http://localhost:3000)**.

---

## 🔧 Adding a New Workflow Node

Adding a new node type requires exactly **3 files**:

```
1. features/workflows/nodes/my-node.ts       ← executor logic
2. features/workflows/nodes/node-executors.ts ← register it here
3. features/workflows/nodes/node-registry.ts  ← add manifest entry
```

**Step 1** — Write the executor (`my-node.ts`):

```ts
import type { NodeExecutor } from "./node-executors"

export const myNodeExecutor: NodeExecutor = async ({ values, getStagehand }) => {
  const stagehand = await getStagehand()
  // ...your logic here
  return { result: "..." }
}
```

**Step 2** — Register in `node-executors.ts`:

```ts
import { myNodeExecutor } from "./my-node"

export const nodeExecutors = {
  // existing executors...
  "my-node": myNodeExecutor,
} satisfies Partial<Record<ActionNodeType, NodeExecutor>>
```

**Step 3** — Add the manifest in `node-registry.ts`:

```ts
"my-node": {
  type: "my-node",
  kind: "action",
  label: "My Node",
  icon: SomeIcon,
  accent: "bg-purple-500 text-white",
  fields: [
    { key: "someField", label: "Some Field", placeholder: "...", required: true },
  ],
  outputs: [
    { path: "result", label: "Result" },
  ],
},
```

The canvas, inspector panel, run task, and logs panel are all **registry-driven** — no other files need to be touched.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js development server with Turbopack |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run format` | Prettier format all `.ts` / `.tsx` files |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:push` | Push schema directly to database (dev) |
| `npm run db:studio` | Open Drizzle Studio database UI |

---

## 🛡️ Authentication & Authorization

- **Clerk** handles all auth: sign-in, sign-up, organization switching, and session management.
- **Organization-scoped**: all workflows are isolated per Clerk `orgId`. Users must be in an organization to create or run workflows.
- **Pro plan gate**: the `Agent` node is restricted to organizations on the Pro Clerk Billing plan, enforced in `runWorkflowAction` via `has({ plan: "pro" })`.
- **Middleware**: `proxy.ts` uses `clerkMiddleware` to protect all routes except `/sign-in` and `/sign-up`. The `/__clerk/:path*` auto-proxy matcher is included.

---

## 🔗 Key Technologies

| Technology | Purpose |
|---|---|
| [Next.js 16 (App Router)](https://nextjs.org) | Full-stack React framework with Server Actions |
| [Clerk](https://clerk.com) | Authentication, organizations, and billing |
| [Stagehand](https://github.com/browserbasehq/stagehand) | AI-powered browser automation (`act`, `extract`, `observe`, `agent`) |
| [Browserbase](https://browserbase.com) | Cloud browser infrastructure and session recording |
| [Trigger.dev](https://trigger.dev) | Durable background task execution |
| [ReactFlow / @xyflow/react](https://reactflow.dev) | Visual node-based canvas editor |
| [Liveblocks](https://liveblocks.io) | Real-time collaborative canvas state |
| [Neon](https://neon.tech) | Serverless Postgres database |
| [Drizzle ORM](https://orm.drizzle.team) | Type-safe SQL query builder and schema migrations |
| [Resend](https://resend.com) | Transactional email delivery |
| [Sentry](https://sentry.io) | Error monitoring and structured logging |
| [shadcn/ui](https://ui.shadcn.com) | Accessible component library |
| [Radix UI](https://www.radix-ui.com) | Headless UI primitives |
| [TailwindCSS v4](https://tailwindcss.com) | Utility-first styling |
| [hls.js](https://github.com/video-dev/hls.js) | HLS video playback for session replays |

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>⚡ <strong>WebWeave</strong> — Weave intelligent browser workflows, visually.<br/>Built with ❤️ using Next.js, Stagehand, Trigger.dev, and Liveblocks</sub>
</div>
