# Governance Window Tracker — Locked Cycle Card

**This is a Phase A lock.** It was written **before any evidence collection**, by design. Everything
above the FREEZE LINE is frozen for the cycle and may not be edited in light of what the evidence turns
out to be. The logs below the line are filled in during Phase B and Phase C. Amendments go to the
following card, never to this one. Rows marked `[A — signed]` turn on an Anthropic matter and carry
the author's sign-off of 2026-10-01.

---

```
GOVERNANCE WINDOW — LOCKED CYCLE CARD
═══════════════════════════════════════════════════════════════════════════
Card ID:      card-2026Q4-OctDec-v2.1
Governs:      Oct 1 – Dec 31, 2026 (calendar quarter; window ends Dec 31)
Locked:       2026-10-01 20:45 US Eastern (EDT, UTC−4) = 2026-10-02 00:45 UTC
              — before any Q4 evidence collection
Mode:         Full assessment
Baseline:     card-2026Q4-v2.0 (locked 2026-08-01; frozen; sha256 prefix
              e8caa556789ed55b), with governance_tracker_Q3_formal_2026-10.md
              as amended by governance_tracker_Q3_formal_addendum_2026-10.md
Instrument:   AI Governance Window Tracker v2.1.0; draft retrieval spec v2.2;
              retrieval_annex_2026Q4-OctDec.md
Late-lock note: the window opened before this lock. No Q4 evidence was
              collected. Seen and not used: the addendum's Oct 1 docket checks.
              Supplied by the author from outside the attached files: the typing
              of xAI v. Bonta; three watch-item dates (marked below). The
              typing and dates for xAI v. Bonta were checked by the author in a
              separate session on Oct 1; sources were dated July 2026 or earlier.
Operator:     Claude, an Anthropic model. Rows marked [A] turn on an Anthropic
              matter and carry the author's sign-off.

GENERAL RULES
  R-1 Event and direction. Every referent and falsifier states the observable
      event and its direction (opening / closing / neither) separately. Labels
      and parentheticals carry no scoring force. If a falsifier and its parent
      referent conflict, the referent's operative clause governs and the
      conflict is logged as a card defect for the next lock.
  R-2 New act. A referent fires only on an event dated inside the window. A
      condition continuing from before the lock is context, not a hit. The only
      exceptions are the absence rules, the end-of-window test in O5.1(b), and
      the lapse rule in O4.2.
      Events dated before Oct 1, 2026 are context only on this card.
  R-3 Single scoring. An event is scored once, under the most specific referent
      it meets, in the domain of its operative effect. A second reading in
      another domain is noted in that domain's summary, unscored.
  R-4 Symmetry. Equivalent conduct is classified identically across labs (G22).
  R-5 Major jurisdiction (whole card). The EU or an EU member state; the US
      federal government; a US state; the UK, Canada, Australia, Japan, South
      Korea; India. Binding measures by other governments are recorded and
      scored "neither", except where a referent states otherwise (O2.4).

WEIGHT LABELS (identical for opening- and closing-hits)
  FULL     Operative clause met in every element by an in-window event; no lens
           applies, or each applied lens's reversal condition is met. Counts
           for F-1.
  PARTIAL  Operative clause met and exactly one lens applies with its reversal
           condition unmet; or the referent itself assigns partial. Counts for
           F-1.
  LOW      Operative clause met with two or more lenses unmet; or the referent
           assigns low; or the observation is un-pre-registered; or the hit
           rests only on "? Assumed" evidence. Listed in synthesis. Does not
           count for F-1 and cannot alone change a domain's status.
  ZERO     Recorded as observed; no weight; needs a log entry naming the lens.
  No other weight word may be used. A step down is one label at a time and is
  always logged.
  Catalog signals. A signal covered by a standing anchor in the domain catalog
  but by no referent on this card is weighted by the same labels, PARTIAL at
  most, identically for opening and closing anchors. The catalog's opening
  anchors are in force.

OPENING-SIGNALS IN FORCE

  D1 — Regulatory & Legal (6)
    O1.1  Event (a): the EU AI Office or Commission adopts a NEW binding act
          under the AI Act: an enforcement decision against a provider (fine,
          compliance order, accepted binding commitment), or an implementing
          act that tightens an obligation.
          Event (b): in any major jurisdiction, a binding instrument reaching
          at least one structural property (emergent optimisation, personalised
          delivery, speed mismatch), or imposing a mandatory frontier incident-
          disclosure duty, is enacted or first enforced.
          Direction: opening.
          Neither: continued operation of powers live since Aug 2; reports
          received; information requests.
          Closing: an act delaying or diluting an obligation already in force.
    O1.2  Event: (a) KGM v. Meta upheld on appeal; or (b) an AI-specific
          design-liability verdict; or (c) KGM cited as controlling in an AI
          matter; or (d) a court decree binding an AI system's conduct is
          issued or affirmed on appeal.
          Direction: opening (counter-ratchet; F-2).
          Closing: KGM reversed, or such a decree vacated, on the merits.
    O1.3  Event: a federal preemption mechanism is defeated, enjoined or
          withdrawn, or an in-window act evidences a legislative stall.
          Silence is not a stall.
          Direction: opening (F-3 on defeat or withdrawal only).
          Stall tier: a leadership statement alone = LOW. A failed vote, or a
          session ending without action = PARTIAL.
          R-3 note: a leadership statement that both stalls preemption and
          refuses safety legislation is scored once, here, at LOW. The refusal
          is noted in Domain 4, unscored, unless a separate in-window act
          evidences it (a blocked vote, an objection to unanimous consent, a
          veto); that act is then scored on its own under the catalog.
          Closing: a preemption mechanism is enacted or upheld.
    O1.4  Event: a binding purpose-limitation instrument (restricting
          retroactive repurposing of collected data) is enacted in a major
          jurisdiction. Direction: opening (F-2).
    O1.5  Event: a conversational-advertising disclosure or constraint is
          adopted with binding force (rule or statute). Direction: opening.
          Absence rule AR-1 applies.
    O1.6  Event: a regulator using authority it already holds takes a formal
          step against an AI developer, deployer or evaluator.       [A — signed]
          Direction, by the conduct targeted:
            opening — deceptive, unsafe or unfair AI conduct, or an evaluator's
                      independence or conflicts;
            closing — a theory penalising compliance with a state AI law, or
                      restricting an evaluator's ability to test or publish.
          Tier: announced inquiry without compulsory process = neither.
                Compulsory process issued = PARTIAL.
                Complaint, consent order or penalty = FULL.
          A court ruling that sustains or defeats such a step is scored here,
          not under O4.2: direction by the same test, weight by O4.2's tiers.

  D2 — Technical Embedding (5)
    O2.1  Event: a critical-infrastructure or government-administrative AI
          deployment is paused, rolled back, or conditioned on a governance
          checkpoint. Direction: opening.
    O2.2  Event: a regulatory checkpoint is created at the dataset → training
          → deployment transition. Direction: opening.
    O2.3  Event: an exit or reversibility mechanism is mandated or adopted at
          scale (audited model portability; required non-AI fallback).
          Direction: opening.
    O2.4  Event (a): a capability- or consequence-based scheme, liability rule
          or procurement standard is ADOPTED that reaches models distributed
          without a provider-mediated gate, whatever their origin, including
          one acting through a distribution hub. Direction: opening.
          Event (b): a measure restricting open-weight models by country of
          origin. Direction: neither; recorded.
          Absence rule AR-2 applies to limb (a).
    O2.5  Event: a binding instrument in force (statute, regulation, executive
          order, utility-commission order, grid-operator order) newly
          conditions, pauses or denies siting, permitting, interconnection,
          energization, water use or state assistance for data centers at or
          above a stated size threshold. Direction: opening.
          Basis: the instrument's operative text, not its press release or an
          accompanying framework's proposals.
          Weight: LOW for an executive order or any instrument a successor can
          rescind alone. PARTIAL if it is enacted in statute or adopted as a
          final regulation or commission order, or if its condition is AI-
          specific (tied to model or deployment governance, not only to size,
          power, water or siting). Never FULL.
          Pattern rule: one instrument scores at its own tier. Three or more
          instruments in three or more jurisdictions in one cycle, each
          confirmed at its operative text, score as ONE hit at PARTIAL. Never
          more than one O2.5 hit per cycle.
          Closing: a federal act overriding state siting, water or permit
          authority for AI or data-center projects; or rescission of such an
          instrument without its stated condition being met.

  D3 — Capability & Deployment (7)
    O3.1  Event: a frontier developer defers or conditions a consequential
          deployment on a process-bearing external governance gate (published
          standard, independent evaluator, or statutory basis).
          Direction: opening. An opaque executive channel does not qualify.
    O3.2  Scope: suspensions imposed or directed by a public authority.
          Event: such a suspension pattern acquires a public legal basis,
          triggering criteria, restoration criteria and independent review.
          Direction: opening.
          Closing: a suspension occurs and is lifted with none of these.
    O3.3  Event: a binding pre-deployment assessment with a real veto, an
          independent evaluator and a published methodology is applied to an
          agentic deployment in a consequential domain. Direction: opening.
    O3.4  Event: the Hassabis-model safety body (or equivalent) becomes
          operational with a published evaluator-independence standard and a
          mandatory submission requirement. Direction: opening.
    O3.5  Event: an independent evaluator-ecosystem element gains formal
          recognition (procurement reference, liability safe-harbor hook, or
          adoption by a regulatory body). Direction: opening.    [A — signed]
          FULL only if the recognised scheme states both (1) an independence
          test covering ownership, other commercial business with the evaluated
          developer, and who pays; and (2) a containment standard for the
          evaluator's own test environment. Missing one = PARTIAL. Missing
          both = LOW. Informal growth = neither.
          Enforcement aimed at an evaluator is scored under O1.6.
    O3.6  Event: a frontier developer's suspension, pause or release
          cancellation is (i) ended only after review by an independent party
          under published criteria, or (ii) made under a commitment a third
          party can enforce.                                     [A — signed]
          Direction: opening. Cap: PARTIAL.
          Neither, logged: a self-administered pause or cancellation; and
          restoration of paused work on the developer's own attestation
          (voluntary lens, both directions). A containment incident itself is
          scored under the catalog.
    O3.7  Event: a binding instrument, or a process-bearing external gate as
          in O3.1, extends assessment, reporting or audit to internal
          deployment of an unreleased frontier model.            [A — signed]
          Direction: opening.
          Closing: a developer discloses, or is credibly reported, to be using
          internally an unreleased model more capable than its released models
          without a completed pre-deployment assessment, where no external
          requirement applies. Self-disclosed = LOW. Revealed by a third party
          or a regulator = PARTIAL.

  D4 — Democratic Institutional Capacity (3)
    O4.1  Event: a regulator or AI safety institute gains statutory authority,
          budget or independence. Direction: opening.
    O4.2  Judicial independence against a documented pressure test.
                                                                 [A — signed]
          Typing:
            Type X — an executive or legislative act aimed at a named party,
                     or at another government's AI law, that is challenged as
                     exceeding authority or as retaliation, other than
                     enforcement of a law of general application.
            Type G — the challenged act is a law or rule of general
                     application binding AI developers or deployers.
            Enforcement of a law or rule of general application by a regulator
            or prosecutor is neither type; it is scored under O1.6.
          Direction:
            Type X defeated on the merits = opening. Sustained = closing.
            Type G sustained on the merits = opening. Struck or enjoined =
            closing.
            Procedural dispositions (standing, mootness, stay, remand,
            rehearing granted, certiorari granted or denied) = neither; logged.
          Tier (both directions; follows the relief at issue):
            preliminary relief, at trial or on appeal             = LOW
            trial-court final judgment, without appellate
            affirmance                                            = PARTIAL
            appellate merits decision on a final judgment or
            petition for review                                   = FULL
          Lapse rule (explicit R-2 exception): a trial-court final judgment
          whose time to appeal lapses in-window with no appeal. If the
          judgment was entered in the same window, judgment and lapse score
          once, at PARTIAL. If the judgment was scored in an earlier cycle,
          the lapse is recorded at LOW, direction by case type, and does not
          count for F-1.
          Reversal of a judgment previously scored opening = closing at FULL,
          weighted as an irreversible loss if it removes a counter-ratchet.
          The mirror applies to a reversed closing-hit.
          A departure from the tier goes through a logged lens whose reversal
          condition has been searched. There is no other reduction.
          Typed at lock: No. 26-1049 (D.C. Cir., § 4713) = X. The N.D. Cal.
          § 3252 judgment and Ninth Cir. No. 26-2011 = X. xAI v. Bonta = G
          (typing supplied by the author).
    O4.3  Event: a constituent-feedback-integrity measure is adopted.
          Direction: opening.

  D5 — Industry Structure (4)
    O5.1  Event (a): a dominant platform adopts a binding accountability
          constraint (third-party audit with teeth; enforceable commitment).
          Direction: opening.                                    [A — signed]
          Accord paths (the Sep 29 Accord or a successor): in-window (1) a
          named auditor meeting O3.5's independence test; (2) a published
          audit standard; (3) a stated veto or consequence; (4) disclosure of
          the commitment as binding in a securities filing; (5) codification
          in statute, regulation or procurement terms. One element = LOW. Two
          or more = PARTIAL. (1)+(2)+(3), or (5) = FULL.
          Closing: an audit is announced as done under an accord with the
          auditor unnamed or results unpublished (opaque-gate).
          No movement = neither.
          Event (b), end-of-window test: at Dec 31, conversational products
          reported ad-free in the Q3 record (the Gemini app, Muse, Claude)
          remain ad-free, verified at each product's own pages. Direction:
          opening, LOW at most. Met only if at least one platform other
          than Claude is verified.                               [A — signed]
          Closing: a platform that was ad-free introduces advertising in its
          conversational product.
    O5.2  Event: a frontier developer's public offering is filed with binding
          accountability conditions; or a binding measure is adopted over the
          stated "rivals win" objection. Direction: opening.     [A — signed]
          "Binding accountability conditions" are new in the filing and
          enforceable by a regulator, a court or an independent third party.
          A developer's existing corporate form or governance structure does
          not qualify. A filing without such conditions = neither.
    O5.3  Event: embedding produces a concrete accountability mechanism
          (insurer or procurement requirement hardening into a de facto
          standard; liability exposure forcing a design change).
          Direction: opening (upgrade lens).
    O5.4  Event: a democratic-bloc instrument (EU plus at least one of UK,
          Canada, Australia, Japan, South Korea) is signed or ratified with
          binding obligations. Direction: opening. WAICO accession by a bloc
          member = PARTIAL (contested).
          Closing: a new act of fragmentation (a rival regime founded; an
          exclusion condition imposed).
          Neither, pre-registered: coordination outside the democratic bloc,
          such as a US–China incident channel. It does not offset a closing-hit.

ABSENCE RULES (the only "absence = closing" referents)
  AR-1 (O1.5) and AR-2 (O2.4a). The rule may fire only if all of these are met:
    — B0 is complete for the window;
    — at least three dated queries, one per month, appear under "searched-and-
      found-nothing" for the sub-strand;
    — the primary rows were checked: for AR-1, the FTC and Federal Register,
      congress.gov, and one state-legislature source; for AR-2, the Federal
      Register (BIS), the AI Office, and one query on Chinese measures.
  Met: closing-hit on the sub-strand, PARTIAL at most. Not met: no finding;
  the line is tagged "? Assumed". No other referent supports an absence finding.

DISCOUNTS IN FORCE (lens → reversal → upgrade)
  predecessor-era → reverses if the framework reaches ≥1 structural property
                  → upgrades if predecessor doctrine is extended to AI.
  voluntary       → reverses if backed by an enforceable hook
                  → upgrades if it hardens into a penalised de facto standard.
  deferred        → reverses when the future step occurs
                  → upgrades if a closure mechanism is itself deferred or
                    defeated.
  contested       → reverses toward constraint = opening; toward deployment =
                    closing
                  → upgrades only through O5.1(b).
  opaque-gate     → reverses if the channel acquires published criteria and
                    independent review. No upgrade.
  embedding-as-governance-generative (upgrade only) → fires only on a concrete
                    generated accountability mechanism.
  Log rule: a reversal condition logged as "checked" must have been searched
  this cycle, and the entry names the query or source. Otherwise the entry
  reads "not searched", and the item goes on the verification-gap list.

UN-PRE-REGISTERED OBSERVATIONS
  An observation is un-pre-registered (UPR) if no referent, closing clause or
  absence rule on this card, and no standing catalog item, covers it. It is
  tagged UPR-open or UPR-close, capped at LOW, and listed separately.
  Aggregation: three or more UPR observations in the same domain and the same
  direction, each "✓ Confirmed" at a primary source, count together as ONE
  hit at PARTIAL. At most once per domain per direction. Declared in a
  synthesis-visibility note naming the observations. Applies identically to
  UPR-close. It does not apply to LOW hits under a referent.
  The verdict carries one sensitivity line: the status if every UPR
  observation were weighted PARTIAL. Each UPR observation goes to the next lock.

NAMED FALSIFIERS
  F-1  If two or more domains register surviving opening-hits, the verdict may
       not be "Narrowing or worse" without an explicit, logged synthesis-
       visibility override. A surviving hit is one at FULL or PARTIAL after the
       discount check. PARTIAL hits count, including an aggregated UPR hit.
       LOW and ZERO do not.
  F-2  An irreversible gain (design-liability precedent; binding embedded-audit
       or disclosure duty; enacted purpose-limitation) is weighted as a
       counter-ratchet, symmetric to a loss.
  F-3  An active-dismantling mechanism defeated or withdrawn is a Domain 1+4
       opening-hit, not a return to neutral.
  F-4  At Close, if no locked opening-signal could realistically have been hit,
       the card was mis-specified toward closure; flag for the next lock.

  Cycle-specific, scheduled inside the window (dates from files 3 and 4 only)
  FC-1 Texas large-load reports due Dec 10; PUCT meeting Dec 17.
       [file 3 §3.2 D2-S1 "reports due Dec 10"; §10.5 "Texas reports due
       Dec 10; PUCT meeting Dec 17"]
       A standing verification or conditioning rule adopted by PUCT or ERCOT =
       O2.5 opening at its tier. Energization resumed after verification is
       complete = neither. Resumed before verification is complete = O2.5
       closing. No action by Dec 31 = deferred.
  FC-2 DOE rules under EO 14421, "due in about 120 days" from Aug 26.
       [file 3 §3.2 D2-S5; the files give no exact date]
       Pre-registered as NEITHER for every referent, unless a rule conditions
       data-center interconnection or energization; then O2.5 at its tier.

  Cycle-specific, pending with no date in the files
  FC-3 Courts (replaces the baseline FC-3; scored only through O4.2 and O1.2).
                                                                 [A — signed]
       Pending steps: rehearing en banc or Supreme Court review in No. 26-1049;
       Ninth Cir. No. 26-2011 and any appeal from the Aug 27 final judgment;
       the Ninth Circuit appeal in xAI v. Bonta; the KGM and New Mexico appeals.
       [file 3 §10.5; file 4 §3.3 and §6; xAI posture supplied by the author]
         Rehearing granted; certiorari granted or denied        = neither
         En banc merits decision reversing the panel            = opening, FULL
         En banc merits decision affirming the panel            = closing, FULL
         Time to appeal the Aug 27 judgment lapses, no appeal   = opening, LOW
                              (O4.2 lapse rule; judgment scored in Q3)
         Ninth Cir. affirms the Aug 27 judgment                 = opening, FULL
         Ninth Cir. reverses the Aug 27 judgment                = closing, FULL
                                                    (irreversible-loss weighted)
         Appellate ruling on preliminary relief (No. 26-2011;
         xAI v. Bonta)                         = LOW; direction by case type
         KGM or New Mexico appeal decided       = per O1.2
  FC-4 Authority-imposed suspension outstanding at lock (the Fable/Mythos
       episode; baseline FC-4 carried).                          [A — signed]
       [file 3 §3.3 notes "FC-4 … Deferred"; §7.5]
       Resolved with a public process document and independent review = O3.2
       opening. Resolved without = O3.2 closing. No resolution = deferred.
  FC-5 FTC industry probe announced Sep 30.                      [A — signed]
       [file 3 §3.1 D1-S5; §10.5]
       Compulsory process issued = O1.6 at PARTIAL, direction by its test.
       No issuance = neither.
  FC-6 Restoration of a frontier developer's paused work.
       [file 3 §6.4 "Domain closest to Critical"; §10.5]
       Watch item. On self-attestation = neither, logged. After independent
       review under published criteria = O3.6 opening, PARTIAL. Any
       containment incident is scored under the catalog.
  FC-7 EO 14409 pre-deployment framework.
       [file 3 §3.4 D4-S4; §10.5]
       Published with criteria and independent review = opaque-gate reversal
       met; logged. Still unpublished = continuing condition, context (R-2).
  Not a falsifier: the claimed seven-day stay in No. 26-1049 (file 4 §6,
  unverified). No rule on this card depends on it.

NAMED FUDGE GUARDS (text carried verbatim from card-2026Q4-v2.0)
  FG-1  No post-hoc renaming of an observed opening-hit as "not really opening."
  FG-2  No silent discounting — every opening-hit pushed toward zero has a log entry.
  FG-3  No surprise absorption — an unpredicted development is not folded into
        "Narrowing" as if predicted; note it un-pre-registered, carry to next card.
  FG-4  No reversibility softening — no quiet drag of a net-positive picture to
        Narrowing; any such move is declared under synthesis-visibility.
  FG-5  No opaque-gate laundering — a process-bearing gate and an opaque executive
        channel are not scored identically. If the opaque-gate discount is not applied
        where warranted, name it.
  Review rule: any review prompt must carry FG-1 to FG-5 in this exact text.
  A pointer to the card is not sufficient.

VERDICT FORMAT
  One status: Opening, Holding, Narrowing, Critical, or Closed (domain-specific).
  With it: the recall designation (G20); any synthesis-visibility declarations;
  the UPR sensitivity line.
  After it, four supplementary jurisdiction lines: EU; US federal; US states
  and courts; International. Each is one of advancing, holding, retreating or
  fragmenting, drawn only from hits already scored. They are not verdicts and
  may not be cited to soften or override the status.

CARRY-FORWARD ADJUDICATIONS
  Baseline verdict (calendar Q3 2026, as amended): NARROWING — thin, at the
    Holding boundary; F-1 override SV-1 stands; recall-limited (scoped);
    confidence low–medium. Domain 4 amended: the D.C. Circuit ruling is a
    closing-hit at low weight, FC-3 letter-hit retained (addendum §3). Not
    fully human-reviewed. This card does not re-score it.
  Weight words in the Q3 record predate the labels defined here and are not
    re-mapped.
  Open Q3 check, O1.4 (California student-data training prohibition): it
    belongs to the Q3 record. Whatever it shows, the event is pre-lock and is
    context only on this card.
  Open Q3 check, ad-free status of the Gemini app and Muse: it belongs to the
    Q3 record. O5.1(b) needs its own verification at Dec 31.
  Other open Q3 items (addendum §6, §9, §10) stay with Q3.
  Q3 un-pre-registered observations, now pre-registered:
    — Texas pause; PA, MA, VA permit orders            → O2.5; FC-1
    — New Mexico decree                                → O1.2(d)
    — FTC probe                                        → O1.6; FC-5
    — self-imposed pauses and withheld releases        → O3.6; FC-6
    — internal deployment of an unreleased model       → O3.7
    — embedded-evaluator contract                      → O3.5 conditions
    — White House Accord                               → O5.1 Accord paths
    — EO 14421                                         → FC-2 (neither)
    — US–China incident channel                        → O5.4 (neither)
  Not carried: the opinion poll. Opinion is not a governance event.

WATCH ITEMS FOR THE QUARTER
  — OpenAI's paused work: restored? on what terms? (→ O3.6, FC-6)
  — FTC demands: issued? scope? treatment of METR? (→ O1.6, FC-5)
  — Texas reports Dec 10; PUCT Dec 17 (→ O2.5, FC-1)
  — GovOps implementation of SB 813 / AB 1405; any mandate (→ O3.5)
  — No. 26-1049 rehearing or Supreme Court review; Ninth Circuit appeals,
    including xAI v. Bonta (→ O4.2, FC-3). xAI v. Bonta oral argument is
    reported for Nov 18 (author-supplied; unverified); argument alone = neither.
  — EO 14409 framework: publication; FOIA suit (→ FC-7)
  — Accord: auditor, standard, consequence, codification (→ O5.1)
  — BIS rule on model access; any adopted Chinese measure on weights (→ O2.4)
  — EU: first enforcement decision; the RubyGems non-report (→ O1.1)
  — Nvidia–Hugging Face antitrust review (→ O2.4 hub clause; catalog)
  — A binding conversational-advertising instrument, anywhere (→ O1.5, AR-1)
  — New Mexico appeal; KGM appeal (→ O1.2)
  — Hassabis body; WAICO mandate text and accessions (→ O3.4, O5.4)
  — Fable/Mythos written rationale (→ O3.2, FC-4)
  — Great-power incident channel: a meeting expected by November (date
    supplied by the author, not in the attached files). Record any outcome.
    (→ O5.4, neither)
  — Deferred candidates, recorded if seen, never scored above UPR: agent-
    authored contamination of shared information infrastructure (d); sub-
    frontier decision models (g); vendor-owned safety standards (i); grid
    and compute concentration (u).

DEFERRED — CANNOT FIRE THIS QUARTER
  — Tucson and Charleston bellwethers (February 2027 per the author; not in
    the attached files). Removed from the watch list until then.
  — Candidates (b), (c), (d), (g), (i), (u): to the next lock.

CADENCE
  Full assessments: quarterly, on calendar-quarter windows.
  Lock: on or before the first day of the quarter the card governs.
  Interim checks: event-driven. Single-domain reads: on demand.
  Next lock: the card for Jan 1 – Mar 31, 2027, on or before Jan 1, 2027.
  Next cadence review: at that lock.

───────────────────────────── FREEZE LINE ─────────────────────────────
Everything above is locked for card-2026Q4-OctDec-v2.1. Below is filled
during Phase B/C.

DISCOUNT-APPLICATION LOG   (Phase B — one line per discount applied)
  [signal → lens → up/down → reversal/upgrade condition: searched (query or
   source) / not searched → result]
  …(empty until scoring)…

PER-DOMAIN COMPRESSION SUMMARIES   (Phase B — one per domain)
  …(empty until scoring)…

SYNTHESIS-VISIBILITY DECLARATIONS   (Phase C — overrides; UPR aggregation)
  …(empty until synthesis)…
═══════════════════════════════════════════════════════════════════════════
```

---

## How to use this card

1. **Phase B0 (sweep)** runs in its own fresh session under `tracker_v2_2_retrieval_spec.md` as
   amended by `retrieval_annex_2026Q4-OctDec.md`. It produces the event ledger and coverage lines.
   No scoring. The final sweep runs on or after Dec 31, 2026.
2. **Phases B–D** run in another fresh session that loads this card and the closed ledger. Score
   Domains 1–5 in order against the referents above, log every discount, tag confidence, and write
   the compression summaries. Fire the mid-run checkpoint after Domain 3.
3. **Phase C** runs the fudge-guard pass first, then the status, the dual clocks and the
   falsifiability check. Diff files stay closed until the verdict is written to the file.
4. **Do not** edit the frozen section to fit the evidence. If the card proves mis-specified, record
   it in the Close handoff and fix it in the card for Jan 1 – Mar 31, 2027.

---

## Amendment log (what changed from `card-2026Q4-v2.0`, and why)

**Which dates each card covered**

| Card | Locked | Dates it actually covered |
|---|---|---|
| `card-2026Q3-v2.0` | 2026-06-23 | Jun 23 – Aug 1, 2026 (Q3 close of 2026-08-01) |
| `card-2026Q4-v2.0` | 2026-08-01 | Governed Aug 1 – Sep 30, 2026. The formal run applied it to Jul 1 – Sep 30, with Jul 1–31 as context only |
| `card-2026Q4-OctDec-v2.1` | 2026-10-01 20:45 US Eastern (2026-10-02 00:45 UTC) | Oct 1 – Dec 31, 2026 |

**Changes**

| Item | Change | Why |
|---|---|---|
| Card name and window | Named for the calendar quarter it governs | Option (c); the earlier name collided with its window |
| R-1 | Event and direction stated separately; referent governs a conflicting falsifier | Finding A |
| R-2 | New-act rule | The Aug 2 EU activation was counted in two closes |
| R-3 | Single scoring | Candidate (m) |
| Weight labels | FULL, PARTIAL, LOW, ZERO defined; other words barred | Finding H |
| UPR rule | LOW cap, bounded aggregation, sensitivity line | Finding E; author decision 5 |
| O1.1 | Requires a new act; limb (b) restores the registry's general binding-instrument default and takes disclosure duties | Author decision 8; candidate (k) |
| O1.2 | Limb (d), court decrees binding AI conduct | New Mexico order was un-pre-registered in Q3 |
| O1.3 | A stall needs an in-window act | R-2 |
| O1.6 | New: enforcement by an existing regulator, with a direction test | Candidates (cc), (ee) |
| O2.4 | Split into capability-based and origin-based limbs; hub clause | Candidates (f), (j) |
| O2.5 | New: physical-substrate gate; LOW for executive orders; upgrade path | Finding C; candidates (n), (t), (dd), (ii), (qq); author decision 3 |
| O3.2 | Scoped to authority-imposed suspensions | Candidate (e) |
| O3.5 | Independence test and containment standard as conditions | Candidates (l), (ll) |
| O3.6 | New: developer-side restraint | Candidates (e), (h) |
| O3.7 | New: internal deployment | Candidate (mm) |
| O4.2 | Rewritten: typing, mirror rule, tiers | Findings A, B, G; author decision 1 |
| O5.1 | Accord paths; end-of-window ad-free test | Candidate (v); R-2 |
| O5.2 | Generalised from the OpenAI IPO to any frontier developer | Author decision 8 |
| O5.4 | Non-bloc coordination pre-registered as neither | Candidate (w) |
| Absence rules | Minimum search depth; PARTIAL cap | Q3 ruling 8 had no stated standard |
| Discount log | "Checked" means searched | Addendum §7 |
| F-1 | States that PARTIAL counts; LOW and ZERO do not | Lock instruction |
| FC-1 to FC-7 | Replace baseline FC-1 to FC-4 | Baseline falsifiers were dated to Aug–Sep |
| Verdict format | Four jurisdiction lines | Candidate (a) |
| Retired | Tucson and Charleston watch items; the Aug 2 clause; baseline FC-3 wording | Cannot fire, or mis-specified |
| Roster and passes | Changed in `retrieval_annex_2026Q4-OctDec.md` | Retrieval and process items are kept off the card |
| Deferred | Candidates (b), (c), (d), (g), (i), (u) | See lock note |
| Rejected | Candidate (x) | Opinion is not a governance event |
| Catalog signals | Weighted by the same labels, PARTIAL at most, both directions; opening anchors in force | Author edit E8; Q3 scored catalog closing signals at full weight |
| R-5 | "Major jurisdiction" defined once. China removed from the list; binding measures by other governments score "neither" unless a referent says otherwise (O2.4) | Author edits E10, C3 |
| O4.2 lapse rule | A lapse on a judgment scored in an earlier cycle is recorded at LOW and does not count for F-1 | Author edit C1; prevents one judgment carrying PARTIAL in two quarters |
| O1.3, R-3 note | A dual-purpose leadership statement is scored once, in Domain 1, at LOW; the refusal is scored in Domain 4 only on a separate in-window act | Author edit C2 |
| Anthropic rows | O1.6/FC-5, O3.5, O3.6/FC-6, O3.7, O4.2/FC-3, O5.1 (Accord paths and ad-free test), O5.2, FC-4 and the "? Assumed" cap were reviewed by the author against three tests: class not company; same score across labs; opening not dependent on Anthropic winning. Signed 2026-10-01, five as drafted and five as amended. O4.2's typed dockets remain the one place where an Anthropic win scores as opening. C1 removes the second-quarter PARTIAL for the Aug 27 judgment | Operator is an Anthropic model |

---

*card-2026Q4-OctDec-v2.1 · Locked 2026-10-01 20:45 US Eastern (2026-10-02 00:45 UTC) · Systems of Thought / AI Governance Window Tracker v2.1.0*
*© 2026 Jedi Wright / UX Minds, LLC*
*Phase A only. Evidence collection begins in a fresh session.*
