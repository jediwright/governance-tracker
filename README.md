# Jedi Wright

## TL;DR

I'm an AI experience architect, content strategist, and UX practitioner by trade, and a builder by history. I've been writing code since Flash and hand-rolled HTML/XHTML/CSS, moved into strategy and architecture as the discipline matured, and have returned to active development through the local-first work in these repos. That story isn't incidental. The governance frameworks here, with the Seam Stack, the Tiered Content Framework, the Pattern Commons, etc., are what you get when someone who has designed and built across a wide range of projects keeps thinking about why the systems those decisions produced keep failing the people inside them, and wants an alternative. So, I'm building a governed architecture for the boundary between personal data and institutional systems, where the platform facilitates a handoff and exit, not accumulation.

The core claim: information asymmetry between institutions and people is architectural before it is political. The architecture can now be built on the person's side. The repos shared here are the build.

**What's running:**
- [localfirst.social](https://localfirst.social) (live build) | [local-first-social-network](https://github.com/jediwright/local-first-social-network) (web repo) | [local-first-social-native](https://github.com/jediwright/local-first-social-native) (native repo, Phase 1 built) — a social network where the user owns the graph and the relay exits after connection. The live web app is joined by a native device app: a Rust core on Automerge + Keyhive for private, device-held data, with AT Protocol for identity, rendezvous, and governed crossing. Built and verified on iOS and Android: an identity created from cold keys, groups with grant and revoke, and recovery from a cold key after the device key is lost. Phase 2 is next: sync between devices and recovery onto a new device. Parallel tracks, not a succession — the web app continues on its own dev line.

**What's specified and implemented:**
- [seam-stack](https://github.com/jediwright/seam-stack) — the four-layer governance framework behind all of it; its [Technical Architecture Blueprint](https://github.com/jediwright/seam-stack/blob/main/BLUEPRINT.md) maps the whole body of work: architecture, repositories, method, and lexicon
- [employment-seam](https://github.com/jediwright/employment-seam) — Pattern Commons #7; the worker owns the knowledge graph

**What's open for feedback:**
- [governedcrossing](https://github.com/jediwright/governedcrossing) — draft AT Protocol lexicons for crossing records, now with a [live example](https://github.com/jediwright/governedcrossing#live-examples): one public crossing, recorded as a signed intent and completion ([watch it animated](https://governedcrossing.org/motion-plate/)). The [access-change draft](https://github.com/jediwright/governedcrossing/blob/main/drafts/access-change.md) is open for comment on the [Atmosphere forum](https://discourse.atmosphere.community/t/1287) until 26 October 2026. 

Note: technically speaking, everything is open to feedback and encouraged.

**What's being tracked:**
- [The AI Governance Window](https://www.systemsofthought.com/governance/) | [governance-tracker](https://github.com/jediwright/governance-tracker) (repo) — a quarterly read on whether the window for binding democratic governance of AI is opening or closing. Latest: Q3 2026, **Narrowing, by a thin margin** ([the assessment](https://www.systemsofthought.com/ai-governance-window-q3-2026/)).

**The argument in long form:** [Full Personhood](https://www.systemsofthought.com/full-personhood/) 
— the governance model AI requires and capitalism never built

**Start here** if you're new: [The Governed Crossing, in Plain Language](https://github.com/jediwright/systems-of-thought/blob/main/start-here/the-governed-crossing-in-plain-language.md) (no background assumed), then [THEORY.md](https://github.com/jediwright/seam-stack/blob/main/THEORY.md) in the seam-stack repo (~650 words), then the [Full Personhood essay](https://www.systemsofthought.com/full-personhood/).

---

## Intro

I build governance architecture for the boundary between personal data and institutional systems — the place where local-first software hands off to the network, where a worker's record crosses into a platform, where a patient's data reaches a health system, where a person's social graph touches a relay, and where financial transactions clear through payment infrastructure. That boundary has never had a principled design. This work and effort are aimed at building just that.

The core argument, developed in the [Full Personhood essay](https://www.systemsofthought.com/full-personhood/) at Systems of Thought (long-form essays and thoughts live there), is that the gap between what institutions know about people and what people can know, control, or demonstrate about themselves is architectural before it is political. The architecture can now be built on the person's side. These repos are the build.

**[systems-of-thought](https://github.com/jediwright/systems-of-thought)** — The research program root. Journal, cross-workstream documentation, and the full arc of the work.

---

## The Architecture (key project repos)

**[seam-stack](https://github.com/jediwright/seam-stack)** — The foundational framework. A four-layer pattern (Substrate, Governance, Boundary, Evidence) for systems where the seam — the governed crossing point between a person's data and an institutional system — is the primary design surface, not the server. The [Technical Architecture Blueprint](https://github.com/jediwright/seam-stack/blob/main/BLUEPRINT.md) is the full map: how the layers work, how records compose, where each idea lives in code across the repositories, the pattern's application notes and known limits, the working method, and a lexicon of architecture and method terms.

**[local-first-series](https://github.com/jediwright/local-first-series)** — Specifications and Pattern Commons entries for governed boundary crossings across employment, commerce, healthcare, and social domains. The [Pattern Commons](https://github.com/jediwright/local-first-series/tree/main/pattern-commons) is a reusable library of architectural patterns for seam design; entries currently include PC#00 (The Governed Crossing), PC#7 (Employment Seam), PC#8 (Substrate-Crossing Seam — governing how a local-first record crosses into a public protocol like AT Protocol / Bluesky), and PC#9 (Governed Content Production Crossing — the publish-side gate that makes the Tiered Content Framework (TCF)'s tier boundaries enforcement gates rather than editorial conventions; specified at v0.3, Counter-Pass tested and converged, not yet prototyped).

**[selvage](https://github.com/jediwright/selvage)** — The formal grammar. A TypeScript parser and JSON Schema emitter for governed crossings: it reads a crossing declaration and produces the schema the crossing record must satisfy. Where the Pattern Commons specifies seams in prose, Selvage makes them machine-checkable. Early — rung-2 grammar only, one seam (the PC#8 Publish crossing) instantiated, not yet paneled. Second-seam work (PC#7 employ-side records) is staged.

**[tcf-runtime](https://github.com/jediwright/tcf-runtime)** — The content governance layer, made executable. The Tiered Content Framework says every piece of content carries an epistemic status — confirmed, inferred, unverified, time-sensitive — declared at the smallest unit and inherited upward, so a composite is never more certain than its weakest member. This repository is the machinery that enforces that at write time: a content-addressed constraint store, SHACL shapes pinned by digest, and a gate that refuses or annotates a write before it is committed. Implements the framework; is not its canonical text. Early — Phase 0 complete (write-time gate on fixtures, engine pinned, every refusal path reached by a real run), Python and a file-backed store first, Automerge reached through an adapter not assumed. Nothing here stops a real publish yet; the crossing gate that would is [PC#9](https://github.com/jediwright/local-first-series/blob/main/pattern-commons/pattern-commons-09-governed-content-production-crossing.md), which is specified to read this runtime's outputs. The runtime spec has since been revised to v0.2 after an independent adversarial review, which also caught one build defect the fixtures missed; the fix is in.

**[governedcrossing](https://github.com/jediwright/governedcrossing)** — The crossing record, written down for a public protocol. A governed crossing record is evidence that data crossed from a person's own system into shared infrastructure: what was authorized to cross, by whom, when, under what exposure claim, and where it landed. This repository holds the bindings that write that record down (the first is a set of AT Protocol lexicons) and the conformance rules a record must meet beyond its schema. The record's meaning stays defined by the `seam:CrossingRecord` vocabulary in seam-stack; each binding maps onto it rather than redefining it. The principles travel with it: the canonical record lives with the person, a public copy discloses no more than the crossing did, and a record describes what crossed without containing it. Draft: names sit under `org.governedcrossing.temp.*` and may change. A [live example](https://github.com/jediwright/governedcrossing#live-examples) is published: one public crossing, recorded as a signed intent and completion on 2 October 2026, with the scripts that produced and check it in [`tools/`](https://github.com/jediwright/governedcrossing/tree/main/tools). The signatures follow the attestation specification as I read it; the one independent verifier I know of rejects them over how a `bytes` field enters the signed hash, and that question is open on the forum. A [short animation](https://governedcrossing.org/motion-plate/) walks through the crossing. The [access-change draft](https://github.com/jediwright/governedcrossing/blob/main/drafts/access-change.md) is open for community feedback on the [Atmosphere forum](https://discourse.atmosphere.community/t/1287) until 26 October 2026.

**[employment-seam](https://github.com/jediwright/employment-seam)** — The reference implementation. Pattern Commons #7: the worker owns the knowledge graph; the platform facilitates the handoff and exits. Built on Automerge + Keyhive for cryptographic local-first document storage, with a live AT Protocol crossing demonstration (PC#8, Phase 3 complete). This is where the architecture runs. Featured in [This Month in Automerge (August 2026)](https://automerge.org/blog/2026-august/) as the first prototype combining Keyhive with AT Protocol.

**[governed-pr-framework](https://github.com/jediwright/governed-pr-framework)** — A lightweight PR review framework that scales rigor by blast radius rather than line count. The governance discipline developed for this work, extracted for general use.

**[local-first-social-network](https://github.com/jediwright/local-first-social-network)** — A social network where the user owns the graph. The relay facilitates connection and exits. Built for people who want presence without performance — connection that doesn't require handing your social graph to a server that monetizes it. Running at [localfirst.social](https://localfirst.social). Originally an exploratory prototype, now being brought under the Seam Stack governance standard. Phase 4 governance retrofit in progress: seam decisions recorded, known limits registered, and my governed PR framework applied. Find me at [localfirst.social/#/connect/@jediwright](https://localfirst.social/#/connect/@jediwright).

**[local-first-social-native](https://github.com/jediwright/local-first-social-native)** — The native device app for the same social network: SwiftUI and Jetpack Compose shells over a shared Rust core, with keys held on the device and data in SQLite. The core runs Keyhive's identity and group model directly — cold admin keys, a device key, grant and revoke behind the app's own policy, and recovery that restores the ability to keep administering groups, not just membership. Built so far on the device side only: the identity ceremony, grant and revoke, and recovery from the cold key all run on iOS and Android. Phase 2 is next: sync between devices, recovery onto a new physical device, and how a lost device's delegations are handled. The AT Protocol crossing comes after. Published [evidence notes](https://github.com/jediwright/local-first-social-native/tree/main/docs), with v1 (2026-09-26) re-measured from the rows the app now stores, record what the app keeps under the current Keyhive encoding and what a format change would cost, written for the Keyhive maintainers. Working name; renamed before public release.

---

## The Argument

The seam-stack architecture rests on a diagnosis about why personal data governance fails: institutions have always had sophisticated data architectures; individuals have not. Telling individuals to negotiate better terms or choose better platforms doesn't address the structural asymmetry. Building a governed architecture on the person's side does.

A person's employment history, health record, or financial data doesn't need to live on a server someone else controls. Local-first software — document stores that sync via conflict-free data structures, with cryptographic access control — makes it technically feasible for the person to hold the authoritative copy. What's been missing is the governance layer: explicit rules for when data crosses out of that personal store, under what terms, with what evidence left behind.

The Seam Stack is that governance layer. The Pattern Commons is the reusable expression of it. The employment-seam prototype is the first demonstrated instance.

For the full theoretical argument, including the five structural requirements and their derivation: [Full Personhood — The Governance Model AI Requires and Capitalism Never Built](https://www.systemsofthought.com/full-personhood/)

---

### Essays & Writing

**[Local-First at the Edge](https://github.com/jediwright/seam-stack/blob/main/essay/local-first-at-the-edge.md)** — Seven boundary principles for what happens where the interior theory of local-first ends. Derives each principle from the specific gap the seven ideals generate at their limits: ungoverned copies, unreachable revocation, ungoverned agents, schema drift, admissibility-uncoupled longevity promises, ungoverned collectives, and ungoverned relays. The theoretical grounding for the Seam Stack, demonstrated across two substrates. Published 2026-08-20.

**[Full Personhood: The Governance Model AI Requires and Capitalism Never Built](https://www.systemsofthought.com/full-personhood/)** — The foundational argument. The gap between what institutions know about people and what people can know, control, or demonstrate about themselves is architectural before it is political. Includes the five structural requirements the Seam Stack is built to satisfy.

**[The AI Governance Window in Q3 2026: Narrowing by a Thin Margin](https://www.systemsofthought.com/ai-governance-window-q3-2026/)** — The third-quarter assessment of whether binding democratic governance of AI is still achievable: the verdict, the five domain readings, and the record behind them.

[Journal](https://github.com/jediwright/systems-of-thought/tree/main/journal) — Cross-workstream dispatches on the full research program:
- [01: What the Work Adds Up To](https://github.com/jediwright/systems-of-thought/blob/main/journal/journal-01-what-the-work-adds-up-to.md) — On the three tracks running simultaneously — prototype, boundary theory, and formal grammar — what each has established, and what a new, second-seam work is for.

[Notebook](https://github.com/jediwright/seam-stack/tree/main/notebook) — Build notes from the Seam Stack in progress: 
- [Entry 01: Building on a Moving Substrate](https://github.com/jediwright/seam-stack/blob/main/notebook/01-building-on-a-moving-substrate.md) — on the Ink & Switch research arc, the Keyhive TypeScript-to-Rust transition, and why the crossing-record schema is specified at the pattern level.
- [Entry 02: Governance, Designed to Compose](https://github.com/jediwright/seam-stack/blob/main/notebook/02-governance-designed-to-compose.md) — on the structural relationship between the Tiered Content Framework and the Automerge binary format, Hexane's format stability guarantee, and why the governance layer and the storage layer are designed to compose.
- [Entry 03: What Gets Tested Before Publishing](https://github.com/jediwright/seam-stack/blob/main/notebook/03-what-gets-tested-before-publishing.md) — on the adversarial sweep that narrowed the Seam Stack's schema governance claim, the prior systems that came closest, and what remains unswept.
- [Entry 04: Testing Whether the Governance Holds](https://github.com/jediwright/seam-stack/blob/main/notebook/04-testing-whether-the-governance-holds.md) — on the three scenarios Phase 3 ran against the employment-seam prototype, what the delayed-release and content-integrity runs found, and what remains open.
- [Entry 05: Running a Framework's Trust Rules for the First Time](https://github.com/jediwright/seam-stack/blob/main/notebook/05-running-a-frameworks-trust-rules-for-the-first-time.md) — on Phase 0 of the Tiered Content Framework's TCF runtime first build, the four places the runtime spec did not execute as written, the build defect a siloed critic caught that twenty fixtures missed, and what the framework's next revision now has to rule on.
- [Entry 06: Taking Stock of the Whole Build](https://github.com/jediwright/seam-stack/blob/main/notebook/06-taking-stock-of-the-whole-build.md) — a state of play across the whole portfolio, paired with the [Technical Architecture Blueprint](https://github.com/jediwright/seam-stack/blob/main/BLUEPRINT.md): where each repository stands, the three questions that cut across all of them, and what comes next.

More writing at [Systems of Thought](https://www.systemsofthought.com).

---

## The AI Governance Window

A separate track from the architecture above.

The AI governance window is the period, roughly now to 2030, in which binding democratic governance of AI is still structurally possible. Two clocks run against it: how deeply AI is embedding in critical infrastructure, and how much capacity democratic institutions still have to impose and enforce rules. The window is the gap between them. I assess it each quarter across five domains (regulatory and legal, technical embedding, capability and deployment, democratic institutional capacity, and industry structure) and return one of five states: Opening, Holding, Narrowing, Critical, or Closed.

**Latest assessment: Q3 2026 (July 1 to September 30) — Narrowing, by a thin margin.** The strongest opening record the tracker has logged. The heavier failures sit where the new rules don't reach.

- [The AI Governance Window in Q3 2026: Narrowing by a Thin Margin](https://www.systemsofthought.com/ai-governance-window-q3-2026/) — the quarterly assessment, domain by domain.
- [The AI Governance Window](https://www.systemsofthought.com/governance/) — the definition, the current status, and the Q3 2026 poster.
- [The AI Governance Window Tracker](https://www.systemsofthought.com/tracker/) — the hosted app, its limits, and the changelog.
- [governance-tracker](https://github.com/jediwright/governance-tracker) — the repo: the local-first web app (signals stay in your browser), the Q3 2026 poster, and an [animated reading of the quarter](https://jediwright.github.io/governance-tracker/gwt-app/public/ai-governance-window-q3-2026-motion-plate.html).

One caveat on the repo: the app still runs the original April 2026 method. I rebuilt the method in June 2026, and the port of that rebuild to the app is specified but not yet built. Treat what the app produces as a demonstration. The quarterly assessments on the site are the current read.

---

## Earlier Prototypes

These explored the problem space and directly informed the architecture above. They're functional demonstrations, not governed to the same standard as the current work.

**[checkout-seam](https://github.com/jediwright/checkout-seam)** / **[local-first-ecommerce](https://github.com/jediwright/local-first-ecommerce)** — A local-first e-commerce prototype. Y.js + IndexedDB for all state; the server is required only for payment processing. Demonstrates deliberate boundary design: the network is the seam, not the default.

**[fhir-seam](https://github.com/jediwright/fhir-seam)** — Local-first patient intake with a FHIR mock endpoint as the seam. The healthcare boundary-crossing case.

---

## Where to Start

**If you want the conceptual frame first:** Read [The Governed Crossing, in Plain Language](https://github.com/jediwright/systems-of-thought/blob/main/start-here/the-governed-crossing-in-plain-language.md) (no background assumed), then [THEORY.md](https://github.com/jediwright/seam-stack/blob/main/THEORY.md) in the seam-stack repo (~650 words), then the [Full Personhood essay](https://www.systemsofthought.com/full-personhood/) for the full argument.

**If you want to see the architecture run:** Start with [PC#7 in local-first-series](https://github.com/jediwright/local-first-series/blob/main/pattern-commons/pattern-commons-07-employment-seam.md) for the spec, then the [employment-seam repo](https://github.com/jediwright/employment-seam) for the implementation.

**If you want the formal grammar:** [selvage](https://github.com/jediwright/selvage) is the parser and schema emitter — the point where a seam specification becomes something a validator can enforce.

**If you build on AT Protocol:** [governedcrossing](https://github.com/jediwright/governedcrossing) holds the draft crossing-record lexicons, the conformance rules, and a live example you can check yourself. The [access-change draft](https://github.com/jediwright/governedcrossing/blob/main/drafts/access-change.md) is open for feedback until 26 October 2026.

**If you want the read on AI governance:** Start with [The AI Governance Window](https://www.systemsofthought.com/governance/) for the definition and current status, then the [Q3 2026 assessment](https://www.systemsofthought.com/ai-governance-window-q3-2026/).

**If you're interested in the governance methodology:** [governed-pr-framework](https://github.com/jediwright/governed-pr-framework) is the most portable piece — usable independently of the rest of this work.

---

## Other Frameworks

**The Tiered Content Framework**

The Governance layer in the Seam Stack is the Tiered Content Framework (TCF) — a seven-tier model for structuring and classifying content so that both humans and machines can reason about what a piece of content is, how trustworthy it is, and how it relates to other content.

The tiers run from Quarks (the governance conditions under which content is valid — constraints, schemas, terminology rules) through Particles, Clusters, Zones, Structures, and Ecosystems, up to Biomes (the complete digital content presence of an organization across every channel it maintains). Three cross-cutting dimensions govern every tier: the Intelligence Layer (how content behaves when dynamically generated or assembled by AI), Taxonomy (the classification system that makes the tier structure machine-actionable), and Machine-Legibility (how content declares itself to external systems — search engines, knowledge graphs, LLMs). The framework is designed to compose with formal knowledge representation standards.

The TCF is documented and versioned at [jediwright.com/content-strategy-framework](https://www.jediwright.com/content-strategy-framework).

**The Resonance Architecture**

The Resonance Architecture is a cross-domain synthesis that argues for structural isomorphism between mind, matter, and consciousness across the same seven organizational tiers first mapped in the TCF, and extends this into a much larger theoretical claim. It is the most speculative of my projects and the one that, if it holds, would reframe the others.

Current status: intellectually rigorous as a working spec, not yet ready for formal research or peer review. The framework has begun doing argumentative work in adjacent projects under a more constrained sense of "resonance" — the recognition of a participant across contexts and over time, requiring a foundation on which prior recognition can compound. That operationalization has been adopted into the governed session methodology running across all active development work here, where participant recognition across sessions is a structural requirement, not a convenience. That adoption is itself an early form of testing. The full cross-domain claim still requires one independent collaborator and at least one operationalized prediction before it reaches funding-grade.

The same organizational logic I found in content strategy and systems thinking may run all the way through matter, mind, and everything in between. Same structure, seven tiers. That's a testable claim. We're the first generation with the computational and cognitive tools to find out whether it holds. That's what this is.

Three versions are in development: a public research essay, a researcher circulation spec, and a frontier companion document for the more speculative material. Each addresses a different audience. 

---

## Stack

TypeScript · Rust · Python · SwiftUI · Jetpack Compose · Automerge · Keyhive · AT Protocol · SHACL · SQLite · Vitest · Tiered Content Framework (TCF) · Resonance Architecture (RA) · Unified Field Orchestrator (UFO) · MIT licensed, except the native app (Apache-2.0)

Active research. Work in progress.

---

*Systems of Thought is the writing and research practice behind this work: [systemsofthought.com](https://systemsofthought.com) | UX Minds, LLC*
