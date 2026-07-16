# Graph Report - .  (2026-07-15)

## Corpus Check
- Corpus is ~33,552 words - fits in a single context window. You may not need a graph.

## Summary
- 147 nodes · 122 edges · 57 communities (10 shown, 47 thin omitted)
- Extraction: 80% EXTRACTED · 15% INFERRED · 5% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- TypeScript Config
- Design System
- UI Pages
- Core Features
- Build Config
- AI Features
- System Architecture
- UI Mockups
- Tech Stack
- SVG Icons
- Framework Logos
- Database Config
- Auth API
- Search API
- Export API
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `System Architecture Diagram` - 8 edges
3. `Terminal Mono Design System` - 8 edges
4. `include` - 7 edges
5. `Ideation Chat Page (Ethereal Glass)` - 7 edges
6. `Blueprint Studio Page` - 6 edges
7. `Active Ideation Chat` - 6 edges
8. `AI-powered Study Planner Proposal` - 5 edges
9. `Node.js Orchestrator` - 5 edges
10. `Spaced Repetition Algorithm` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Blueprint Studio UI Screenshot` --semantically_similar_to--> `Blueprint Studio UI Screenshot (non-public)`  [AMBIGUOUS] [semantically similar]
  public/stitch-assets/screenshots/blueprint-studio.png → stitch-assets/screenshots/blueprint-studio.png
- `Chat UI Screenshot` --semantically_similar_to--> `Chat UI Screenshot (non-public)`  [AMBIGUOUS] [semantically similar]
  public/stitch-assets/screenshots/chat.png → stitch-assets/screenshots/chat.png
- `Landing Page UI Screenshot` --semantically_similar_to--> `Landing Page UI Screenshot (non-public)`  [AMBIGUOUS] [semantically similar]
  public/stitch-assets/screenshots/landing.png → stitch-assets/screenshots/landing.png
- `Geist Body Font` --semantically_similar_to--> `Geist Font (Vercel)`  [INFERRED] [semantically similar]
  stitch-assets/DESIGN.md → README.md
- `LLM Auto-Quiz Generation from PDFs` --conceptually_related_to--> `OpenAI GPT-4o-mini`  [INFERRED]
  public/stitch-assets/html/chat.html → public/stitch-assets/html/blueprint-studio.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CapstoneAI Technology Stack** — capstone-ai_readme_nextjs_project, capstone-ai_test_supabase_mcp_configuration, capstone-ai_stitch-assets_design_terminal_mono [INFERRED 0.75]
- **Study Planner System Architecture** — public_stitch-assets_html_blueprint-studio_react_nextjs, public_stitch-assets_html_blueprint-studio_api_gateway, public_stitch-assets_html_blueprint-studio_nodejs_orchestrator, public_stitch-assets_html_blueprint-studio_ocr_service, public_stitch-assets_html_blueprint-studio_openai_gpt4o_mini, public_stitch-assets_html_blueprint-studio_postgresql_supabase [EXTRACTED 1.00]
- **Idea Evaluation Pipeline** — public_stitch-assets_html_chat_idea_verification_system, public_stitch-assets_html_chat_academic_novelty_verification, public_stitch-assets_html_chat_github_similarity_check [EXTRACTED 1.00]
- **CapstoneAI User Flow Pipeline** — public_stitch-assets_html_landing_capstoneai_landing_page, public_stitch-assets_html_chat_ideation_chat_page, public_stitch-assets_html_blueprint-studio_blueprint_studio_page [INFERRED 0.95]
- **Terminal Mono Design System Dimensions** — capstone-ai_stitch-assets_design_monochromatic_palette, capstone-ai_stitch-assets_design_typography_system, capstone-ai_stitch-assets_design_fixed_grid_layout, capstone-ai_stitch-assets_design_tonal_elevation, capstone-ai_stitch-assets_design_shape_language [EXTRACTED 1.00]
- **Typography Font Families** — capstone-ai_stitch-assets_design_space_grotesk, capstone-ai_stitch-assets_design_geist_body, capstone-ai_stitch-assets_design_geist_mono [EXTRACTED 1.00]
- **Cohesive monoline UI icon set sharing identical design tokens (16x16 viewBox, #666 fill, flat monoline style)** — capstone-ai_public_file_file_icon, capstone-ai_public_globe_globe_icon, capstone-ai_public_window_window_icon [INFERRED 0.85]
- **Public vs Non-public Screenshot Pairs** — capstone-ai_public_stitch-assets_screenshots_landing_png, capstone-ai_stitch-assets_screenshots_landing_png [AMBIGUOUS 0.20]
- **CapstoneAI Application Flow** — stitch_assets_html_landing_capstoneai, stitch_assets_html_chat_active_ideation_chat, stitch_assets_html_blueprint_studio_blueprint_studio [INFERRED 0.85]
- **Study Planner Technology Stack** — stitch_assets_html_blueprint_studio_react_nextjs, stitch_assets_html_blueprint_studio_nodejs_edge, stitch_assets_html_blueprint_studio_postgresql_supabase, stitch_assets_html_blueprint_studio_openai_gpt4o_mini [EXTRACTED 1.00]
- **Study Planner Feature Set** — stitch_assets_html_chat_spaced_repetition_algorithm, stitch_assets_html_chat_llm_quiz_generation, stitch_assets_html_chat_sm2_algorithm [INFERRED 0.85]

## Communities (57 total, 47 thin omitted)

### Community 0 - "TypeScript Config"
Cohesion: 0.10
Nodes (21): ./*, dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental (+13 more)

### Community 1 - "Design System"
Cohesion: 0.19
Nodes (14): Geist Font (Vercel), Next.js Project, CapstoneAI Brand, Component Library, Fixed Grid Layout System, Geist Body Font, Geist Mono Font, Minimalism + Modern Brutalism Design Philosophy (+6 more)

### Community 2 - "UI Pages"
Cohesion: 0.24
Nodes (11): Blueprint Studio Page, Document Structure Navigation, Markdown Export Feature, Academic Novelty Verification, GitHub Similarity Check, Ideation Chat Page (Ethereal Glass), Blockchain Voting System Suggestion, CapstoneAI Landing Page (+3 more)

### Community 3 - "Core Features"
Cohesion: 0.27
Nodes (11): AI-powered Study Planner, Blueprint Studio, Document Structure Navigation, Active Ideation Chat, High Academic Novelty, LLM Auto-Generated Quizzes, No Exact End-to-End GitHub Matches, SM-2 Algorithm (+3 more)

### Community 4 - "Build Config"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 5 - "AI Features"
Cohesion: 0.28
Nodes (9): Schedule Generation, Serverless Architecture Pattern, AI-powered Study Planner Proposal, Syllabus Ingestion, LLM Auto-Quiz Generation from PDFs, Neural Network Spaced Repetition Approach, SM-2 Algorithm, Spaced Repetition Algorithm (+1 more)

### Community 6 - "System Architecture"
Cohesion: 0.52
Nodes (7): API Gateway, Node.js Orchestrator, OCR Service, OpenAI GPT-4o-mini, PostgreSQL via Supabase, React (Next.js) Frontend, System Architecture Diagram

### Community 7 - "UI Mockups"
Cohesion: 0.40
Nodes (6): Blueprint Studio UI Screenshot, Chat UI Screenshot, Landing Page UI Screenshot, Blueprint Studio UI Screenshot (non-public), Chat UI Screenshot (non-public), Landing Page UI Screenshot (non-public)

### Community 8 - "Tech Stack"
Cohesion: 0.53
Nodes (6): Node.js Edge Functions, OCR Service, OpenAI GPT-4o-mini, PostgreSQL (Supabase), React (Next.js), Serverless Architecture

### Community 9 - "SVG Icons"
Cohesion: 1.00
Nodes (3): File/document icon — 16x16 monoline SVG showing a page with text lines, used as a UI icon in the capstone-ai Next.js app, Globe/world icon — 16x16 monoline SVG depicting a globe with latitude and longitude lines, used as a UI icon in the capstone-ai Next.js app, Browser window icon — 16x16 monoline SVG depicting a browser/app window with three-dot title bar, used as a UI icon in the capstone-ai Next.js app

## Ambiguous Edges - Review These
- `Blueprint Studio UI Screenshot` → `Chat UI Screenshot`  [AMBIGUOUS]
  public/stitch-assets/screenshots/blueprint-studio.png · relation: conceptually_related_to
- `Blueprint Studio UI Screenshot` → `Blueprint Studio UI Screenshot (non-public)`  [AMBIGUOUS]
  public/stitch-assets/screenshots/blueprint-studio.png · relation: semantically_similar_to
- `Blueprint Studio UI Screenshot` → `Landing Page UI Screenshot`  [AMBIGUOUS]
  public/stitch-assets/screenshots/landing.png · relation: conceptually_related_to
- `Chat UI Screenshot` → `Chat UI Screenshot (non-public)`  [AMBIGUOUS]
  public/stitch-assets/screenshots/chat.png · relation: semantically_similar_to
- `Chat UI Screenshot` → `Landing Page UI Screenshot`  [AMBIGUOUS]
  public/stitch-assets/screenshots/landing.png · relation: conceptually_related_to
- `Landing Page UI Screenshot` → `Landing Page UI Screenshot (non-public)`  [AMBIGUOUS]
  public/stitch-assets/screenshots/landing.png · relation: semantically_similar_to

## Knowledge Gaps
- **89 isolated node(s):** `target`, `dom`, `dom.iterable`, `esnext`, `allowJs` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blueprint Studio UI Screenshot` and `Chat UI Screenshot`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Blueprint Studio UI Screenshot` and `Blueprint Studio UI Screenshot (non-public)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Blueprint Studio UI Screenshot` and `Landing Page UI Screenshot`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Chat UI Screenshot` and `Chat UI Screenshot (non-public)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Chat UI Screenshot` and `Landing Page UI Screenshot`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Landing Page UI Screenshot` and `Landing Page UI Screenshot (non-public)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `compilerOptions` connect `TypeScript Config` to `Build Config`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._