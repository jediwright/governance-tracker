# Session Handoff: InfinityDrive × Governance Tracker Prototype
**Prepared:** April 19, 2026  
**For:** Claude Code (new session)  
**Author:** J. Wright / UX Minds, LLC

---

## What this session is for

Build a working localhost prototype of the **Governance Window Tracker** as a local-first web application — one that visibly inherits the InfinityDrive permission architecture and uses Claude API for AI-powered signal synthesis. This is a demonstration prototype for a recruitment prospectus directed at Adam Wiggins and Orion Henry (co-founders of InfinityDrive, co-founders of Heroku, Ink & Switch research lab). The prototype must actually run, not just render in a chat window.

---

## Why this matters / the thesis being demonstrated

In 2003–2006, Wiggins and Henry built InfinityDrive — a multi-tenant WebDAV cloud storage service with a custom Apache module (`mod_infinity.c`) that enforced per-user, per-share, per-operation-type access control at the protocol layer. The core of that module is a `can_access()` function that distinguishes read / write / delete as separate permission checks against a PostgreSQL `share_permissions` table.

The Ink & Switch research lab (co-founded by Wiggins) now produces the foundational work on local-first software — user-owned data, CRDT-based sync, no platform dependency. Their Automerge library is the primary CRDT implementation.

The prototype demonstrates that:

1. InfinityDrive's permission model is a direct technical ancestor of local-first contributor trust architecture
2. That architecture, combined with CRDT-based state, is the right foundation for a distributed governance monitoring instrument
3. The Governance Window Tracker — a five-domain AI governance monitoring tool from J. Wright's Systems of Thought project — is a natural first application

The prototype is the argument made executable.

---

## Source material available

The InfinityDrive source code is in the Claude project (re-upload `infinityDrive.zip` if needed).

**Key files to reference:**

**`mod_infinity/mod_infinity.c`** — The Apache module. Critical functions:
- `can_access(request_rec *r)` — the permission enforcement logic
- `access_type()` — distinguishes read / write / delete by HTTP method
- `extract_account()` / `extract_share()` — URL-to-namespace parsing
- `mod_infinity_check_user_id()` — auth against Postgres

**`sql/infinity.sql`** — The database schema. Key tables:
- `users`, `shares`, `share_permissions` (read bool, write bool)
- `accounts`, `plans`, quota enforcement
- `bandwidth` metering

**`html/account/defs.inc`** — PHP implementation of the permission model, mirroring the C module logic at the application layer.

**The permission model to port to TypeScript:**

| InfinityDrive concept | Tracker equivalent |
|---|---|
| account owner (root user) | primary assessor — full read/write |
| share contributor (write permission) | domain contributor — write to their domain |
| share reader (read only) | public reader — read all, write none |
| over_quota check blocks writes | assessment lock during review period |
| share_permissions JOIN | contributor credential check before any signal submission |

---

## What to build

### Stack

- **React + TypeScript** (Vite for dev server)
- **Y.js** for CRDT-based local state (simulates local-first data model; use `y-indexeddb` for browser persistence)
- **Claude API** (`claude-sonnet-4-20250514`) for signal synthesis
- **Tailwind CSS** for styling (CDN, keep it simple)
- No backend server required — all state is local, Claude API called from the browser with a user-supplied API key

### Application: The Governance Window Tracker (Local-First Edition)

A single-page application with three panels.

---

**Panel 1 — Contributor Trust (Permission Model)**

Visible display of the InfinityDrive permission architecture as the app's trust model. Show the three tiers (Primary Assessor, Domain Contributor, Public Reader) with their read/write/lock permissions. This is not UI chrome — it is the architectural claim made visible. Include a note: *"Permission model derived from mod_infinity.c (InfinityDrive, 2004)."*

---

**Panel 2 — Five Domain Signal Board**

The five Tracker domains as cards:

1. Regulatory & Legal Frameworks
2. Technical Embedding
3. Capability Acceleration
4. Democratic Institutional Capacity
5. Industry Structure & Power

Each card has:
- A status indicator (Opening / Holding / Narrowing / Critical / Closed) as a colored dot (green / yellow / orange / red / dark red)
- A signal input field (text area for entering a recent development)
- A "submit signal" button that respects the permission tier (contributors can submit; readers see a locked state)
- Timestamp of last update (Y.js document clock)

---

**Panel 3 — Window Status + Claude Synthesis**

A "Run Synthesis" button that:

1. Collects the current state of all five domain cards from the Y.js document
2. Sends a structured prompt to Claude API requesting:
   - A binding-authority gap assessment
   - Dual-clock positions (Embedding Clock / Institutional Erosion Clock)
   - Overall window status verdict (one of the five statuses)
   - 2–3 sentence synthesis
3. Renders the response in a structured output card with the window status as a prominent indicator

The synthesis prompt references the analytical framework: the three structural properties (optimization without intent, personalization with feedback closure, speed-deliberation asymmetry), the asymmetric reversibility principle, and the binding-authority gap concept.

---

**Data persistence:**  
All signal inputs and status settings persist in Y.js / `y-indexeddb`. On reload, the app restores from local storage. This is the local-first demonstration — data never leaves the browser unless the user explicitly exports it.

**Export:**  
A "Export Assessment" button generates a markdown file of the current assessment state, downloadable as `governance-tracker-[date].md`.

---

## The InfinityDrive heritage note

The app includes a small collapsible "About this architecture" section:

> The contributor permission model in this application is derived from `mod_infinity.c`, a custom Apache module written by Adam Wiggins and Orion Henry for InfinityDrive (2003–2006). The original module enforced per-user, per-share, per-operation-type access control at the HTTP protocol layer — distinguishing read, write, and delete as separate permission checks against a PostgreSQL share_permissions table. The trust tier architecture here inherits that model directly. Local-first data ownership, per-contributor scoped write access, and operation-type-aware permission checking: the same architectural convictions, twenty years later.

This is not decorative. It is the demonstration.

---

## Claude API integration

**Endpoint:** `POST https://api.anthropic.com/v1/messages`  
**Model:** `claude-sonnet-4-20250514`  
**Max tokens:** 1000  

Call from the browser via fetch. For localhost dev, the user enters their API key in an input field.

**System prompt:**

```
You are the AI Governance Window Tracker, a structured assessment instrument
monitoring whether the window for binding democratic AI governance is narrowing
or closing. You operate on a specific analytical framework: the binding-authority
gap (distance between credible governance frameworks and their enforceability),
the dual-clock structure (Embedding Clock and Institutional Erosion Clock), and
the asymmetric reversibility principle (epistemic losses are ratchets;
institutional losses are imperfectly recoverable).

Given domain signal inputs across five monitoring domains, produce:
1. An overall Window Status: Opening / Holding / Narrowing / Critical / Closed
2. Embedding Clock position: Early / Mid / Late, with rate of movement
3. Institutional Erosion Clock position: Early / Mid / Late, with rate of movement
4. Binding-authority gap direction: Narrowing / Stable / Widening
5. A 2–3 sentence synthesis of the cross-domain picture

Be specific. Name the most consequential signal. Apply asymmetric reversibility
weighting — deterioration in epistemic infrastructure scores worse than
equivalent deterioration in regulatory capacity because it resists repair.
Return JSON only, no prose wrapper.
```

**Expected JSON response:**

```json
{
  "window_status": "Narrowing",
  "embedding_clock": { "position": "Mid", "rate": "Accelerating" },
  "erosion_clock": { "position": "Mid", "rate": "Steady" },
  "gap_direction": "Widening",
  "synthesis": "...",
  "key_signal": "..."
}
```

---

## Build order

1. Scaffold Vite + React + TypeScript project
2. Add Y.js + `y-indexeddb`, Tailwind (CDN)
3. Build the data model (Y.js Map for each domain's status + signals)
4. Build the permission tier component (Panel 1) — port the InfinityDrive trust model to TypeScript, make it visible and interactive
5. Build the five domain cards (Panel 2) — wired to Y.js state
6. Build the Claude API integration and synthesis panel (Panel 3)
7. Add export function
8. Add the "About this architecture" heritage note
9. Final styling pass — Systems of Thought design tokens:
   - Accent: `#081225` (deep navy-black)
   - Font: Inter (body), system serif for headings
   - Clean white background, minimal decoration

---

## What success looks like

A running `localhost:5173` app that:
- Loads with the five domain cards in their last-saved state (Y.js persistence)
- Allows signal submission with permission-tier enforcement visible
- Runs a Claude API synthesis on demand and renders a structured verdict
- Exports a markdown assessment
- Has the InfinityDrive heritage note visible and legible
- Looks credible — not polished to production, but clearly not a toy

---

## Context from prior session

The full analytical context lives in the Claude project. The eight documents of the End of History Project are in the project files. The AI Governance Window Tracker skill at `/mnt/skills/user/ai-governance-window-tracker/SKILL.md` is the authoritative source for the five-domain structure, signal categories, status definitions, and synthesis methodology.

The prospectus is `Closing_the_Circle_Brief_v1_0.docx` — it contains the full argument for why InfinityDrive's architecture is the right ancestor for this prototype and frames the recruitment case for Wiggins and Henry.

---

## Kickoff prompt

> I need to build a working localhost prototype called the **Governance Window Tracker (Local-First Edition)**. It's a React + TypeScript + Y.js web application that combines:
>
> 1. The InfinityDrive permission model (from `mod_infinity.c`, 2004) ported to TypeScript as a contributor trust tier system
> 2. The AI Governance Window Tracker's five-domain signal board as Y.js CRDT-backed local state
> 3. Claude API integration for structured governance synthesis
>
> The full build spec is in `session_handoff_governance_tracker_prototype.md`. The InfinityDrive source code is available — I'll upload `infinityDrive.zip`. Please read the spec before writing any code, confirm you understand the build order, then start with step 1: scaffold the Vite + React + TypeScript project.
>
> The purpose is to demonstrate a thesis to Adam Wiggins and Orion Henry (Ink & Switch) — that their 2004 permission architecture is a direct ancestor of local-first AI governance infrastructure. The prototype is the argument made executable. Quality of that argument matters more than polish.

---

## Files to bring into the new session

- `infinityDrive.zip` (re-upload)
- This handoff: `session_handoff_governance_tracker_prototype.md`
- The prospectus: `Closing_the_Circle_Brief_v1_0.docx`
- Governance Window Tracker skill: `/mnt/skills/user/ai-governance-window-tracker/SKILL.md`