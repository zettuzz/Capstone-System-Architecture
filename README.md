# CapstoneAI

**AI-Powered Thesis Adviser for CS/IT Students** — built with Next.js 16, Supabase, Clerk, and NVIDIA.

CapstoneAI is an interactive AI mentor that guides Filipino CS/IT students through a structured interview to define their capstone project, researches existing systems, evaluates the idea, and generates a complete project blueprint — all through a visual node-based workspace.

---

## Features

- **9-Step Guided Interview** — An AI mentor (friendly senior student persona) walks you through idea definition, one question at a time
- **Live Web Research** — Automatically searches for similar systems and GitHub repositories during the interview
- **Interactive Workspace** — Visual node graph (React Flow) showing the project tree: Root Idea → Topics → Research → Evaluation → Blueprint
- **Auto-Generated Blueprint** — After the interview, produces a 12-section Markdown document with architecture, tech stack, timeline, risk assessment, and weekly schedule
- **Dual Auth** — Clerk handles sign-in/up with Google/GitHub/email; middleware protects all workspace pages
- **Token Budget System** — Shared allowances (150K total / 5K daily) so students can try the AI without their own API keys
- **Bring Your Own Key** — Advanced users can connect their own NVIDIA or OpenRouter API key (stored encrypted via AES-256-GCM)
- **Dark Terminal-Inspired UI** — Clean, minimal design with monospace typography and a moody dark palette

---

## How It Works — The 9-Step Interview

The AI follows a strict 9-exchange conversational flow. Each step asks exactly ONE question, never bundles, and waits for the student's response before proceeding.

| # | Step | What the AI Does | Behind the Scenes |
|---|------|-----------------|-------------------|
| 1 | **The Idea** | "What's your project idea?" | Creates a root idea node in the workspace |
| 2 | **The Problem** | "What problem does it solve?" | Creates a topic child node |
| 3 | **The Type** | "Web, mobile, desktop, or hybrid?" | Triggers an automatic web search for similar systems |
| 4 | **Similar Systems** | Mentions 1-2 findings, then asks about team size | Tavily search + creates a Research node with results |
| 5 | **Timeline** | "How many months to finish?" | Stores timeline data in the project |
| 6 | **Tech Stack** | "Preferred stack or should I suggest one?" | AI prepares a stack recommendation based on project type |
| 7 | **Features** | "Any specific features?" | Creates additional topic nodes for key features |
| 8 | **Summary** | Recaps project + recommends tech stack | AI generates a comprehensive summary node |
| 9 | **Lock In** | "Locking in your project!" | Auto-triggers evaluation → blueprint generation |

After step 9, the chat locks and the blueprint panel opens automatically.

---

## Behind the Frontend — Architecture

### Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │ ──► │  Next.js 16  │ ──► │  API Routes     │
│  (React +   │     │  App Router  │     │  /api/chat      │
│  XYFlow)    │ ◄── │  + Clerk     │ ◄── │  /api/evaluate  │
└─────────────┘     └──────────────┘     │  /api/export    │
                                          │  /api/search    │
                                          │  /api/github-   │
                                          │   search        │
                                          └───────┬─────────┘
                                                  │
                    ┌─────────────────────────────┼──────────────┐
                    │                             │              │
              ┌─────▼──────┐             ┌────────▼──────┐      │
              │  NVIDIA     │             │   Tavily      │      │
              │  LLM API    │             │   Web Search  │      │
              │ (default)   │             │               │      │
              └────────────┘             └───────────────┘      │
              ┌─────────────┐            ┌────────────────┐     │
              │  OpenRouter │            │  GitHub API    │     │
              │ (optional)  │            │  (Octokit)     │     │
              └─────────────┘            └────────────────┘     │
                                                                │
        ┌────────────────────────────────────────────────────────┘
        ▼
┌────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Supabase      │     │   Upstash Redis  │     │   Clerk Auth     │
│  (PostgreSQL)   │     │ (Cache + Rate-   │     │  (User Mgmt)     │
│                 │     │   Limiter)       │     │                  │
│ • projects      │     │                 │     │ • Sign in/up     │
│ • sessions      │     │ • API response   │     │ • Session        │
│ • evaluations   │     │   caching (24h)  │     │ • Middleware     │
│ • user_api_keys │     │ • Rate limiting  │     │   protection     │
│                 │     │   (30 req/60s)   │     │                  │
└────────────────┘     └─────────────────┘     └──────────────────┘
```

### Key Components

**Chat API (`/api/chat`)**
- Accepts messages + optional context (node title, search results)
- Prepends a system prompt encoding the 9-step interview flow
- Streams tokens back via SSE (`text/plain` with `0:<json>\n` format)
- Appends invisible `<!-- INTERVIEW_INSTRUCTION -->` blocks after each response
- The client parses these blocks to trigger workspace actions (create node, search, evaluate)

**Evaluation API (`/api/evaluate`)**
- Fetches similar projects from Tavily web search + GitHub API
- Sends the full conversation + search results to the LLM
- Returns a structured JSON evaluation: score, feasibility, tech stack, improvements, research gaps

**Export / Blueprint API (`/api/export`)**
- Takes the evaluation + conversation history
- Generates a 12-section Markdown blueprint via the LLM
- Includes: abstract, architecture, tech stack, 8-week schedule, risk assessment
- Saves to Supabase; cached for 7 days

**Workspace (React Flow / XYFlow)**
- Each student idea becomes a **root node**
- Each AI response creates a **child topic node** connected by a smoothstep edge
- Research findings create a **Research node** (yellow dot)
- Evaluation creates a **Grade node** (purple dot)
- Blueprint becomes a **Blueprint node** — opens a slide-in panel with markdown preview
- Auto-layout arranges nodes in horizontal bands per root idea

### Auth & Security

| Feature | Implementation |
|---------|---------------|
| Authentication | Clerk (email, Google, GitHub OAuth) |
| Route Protection | `clerkMiddleware` with `auth.protect()` on `/chat`, `/result`, `/blueprint-studio`, `/workspace` |
| Database | Supabase with Row-Level Security (all 5 tables) |
| API Key Storage | AES-256-GCM encrypted in Supabase `user_api_keys` table |
| Token Budget | Client-side tracking: 150,000 total / 5,000 daily per user |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Auth** | Clerk (`@clerk/nextjs`) |
| **Database** | Supabase (PostgreSQL via `@supabase/supabase-js`) |
| **Cache & Rate Limiting** | Upstash Redis (`@upstash/redis`) |
| **Default LLM** | NVIDIA (`nvidia/llama-3.3-nemotron-super-49b-v1`) |
| **Alternate LLM** | OpenRouter (`nvidia/nemotron-3-ultra-550b-a55b:free`) |
| **Web Search** | Tavily API (excludes YouTube, social media) |
| **Code Search** | GitHub REST API (Octokit) |
| **Graph Canvas** | XYFlow / React Flow (`@xyflow/react`) |
| **Styling** | Tailwind CSS v4 |
| **Markdown** | markdown-it |
| **Testing** | Vitest |
| **Deployment** | Vercel |
---

