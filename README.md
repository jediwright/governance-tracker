# AI Governance Window Tracker

A local-first web app for assessing whether the window for binding democratic AI governance is opening or closing, across five domains.

> **Status, October 2026: the app runs the current method, v2.1.**
> It scores the signals you enter against the locked October–December 2026 card and can return any of the five statuses. It opens on the Q3 2026 result and reads new signals as movement from there. It does not search for evidence or verify what is entered, so a reading from the app is not the tracker's assessment of record.
>
> **Latest assessment of record:** Q3 2026 (July 1 to September 30). Status: **Narrowing, by a thin margin.**
> Write-up: [The AI Governance Window in Q3 2026](https://www.systemsofthought.com/ai-governance-window-q3-2026/) · Poster and status: [The AI Governance Window](https://www.systemsofthought.com/governance/)

<a href="https://jediwright.github.io/governance-tracker/gwt-app/public/ai-governance-window-q3-2026-motion-plate.html" target="_blank" rel="noopener"><img src="gwt-app/public/ai-governance-window-q3-2026-poster.svg" alt="The AI Governance Window Tracker, calendar Q3 2026 poster: Narrowing, by a thin margin."></a>

*The calendar Q3 2026 poster. Click through for the animated version.*

## What the window is

The AI governance window is the period, roughly now to 2030, in which binding democratic governance of AI is still structurally possible. Two clocks run against it. One measures how deeply AI is embedding in critical infrastructure. The other measures how much capacity democratic institutions still have to impose and enforce rules. The window is the gap between them.

I assess it across five domains: regulatory and legal, technical embedding, capability and deployment, democratic institutional capacity, and industry structure. The result is one of five states: Opening, Holding, Narrowing, Critical or Closed.

## How the app reads signals

Each quarter I lock a card before reading any evidence. The card says in advance which events would count as the window opening, which as closing, and how much weight each carries. The app scores what you enter against that card.

- **It starts from the last assessment of record.** The Q3 2026 result is the baseline. New signals are read as movement against it, and the two tallies are not added together.
- **Only signals dated October 1 to December 31, 2026 carry weight.** Earlier events are already counted in the baseline. Undated signals are classified and carry no weight.
- **A new reading needs three domains** with a dated, in-window signal classified opening or closing. Below that, the Q3 result stays on screen.
- **Each domain card has a read-only status row.** It shows the Q3 record until a run, then that run's reading in the method's own words, or "No data", "Context only" or "No direction yet".
- **Weights assume each signal is accurate as entered.** The app checks nothing and runs no search. Every result says so, and confidence is capped at medium.
- **A reply that breaks the card's rules is not shown.** The server checks each reply. If one fails, it asks the model once more and says what was wrong. If the second reply also fails, the app asks you to run the synthesis again.
- **Signals are saved in your browser only, and results are not saved at all.** A reload refills the boxes and returns the cards to the Q3 record. To remove a saved signal, empty its box and click Clear Signal.

Running a synthesis sends your signals through the app's server to an AI model made by Anthropic, which produces the reading. The server does not store them. Where a signal names Anthropic, the model is scoring its own developer, and the result says so.

The card is the tracker's own working rules, not a standard anyone else has set.

## What is in this repo

| Path | What it is |
|:---|:---|
| `gwt-app/` | The web app: Vite, React and TypeScript, with Yjs and IndexedDB for local-first storage |
| `gwt-app/server.js` | A local server for development |
| `api/synthesize.js` | The same endpoint as a Vercel serverless function, for production |
| `api/_synthesisCore.js` | The code both servers share: it validates the signals, builds the request, calls the Anthropic API, and checks the reply against the card's rules |
| `api/_method.js` | Generated, for the server. The prompt, the card's identity and the baseline |
| `gwt-app/src/method.generated.ts` | Generated, for the page. The card's identity and the baseline |
| `method/card-2026Q4-OctDec-v2_1.md` | The locked card for October 1 to December 31, 2026, unedited |
| `method/prompt-template.txt` | The rest of the prompt. The card's text is pulled in from the card file by line number |
| `method/baseline.json` | The Q3 2026 baseline and its five domain readings |
| `method/build-prompt.mjs` | Builds the two generated files, and refuses to run if the card file has changed |
| `test/core.test.mjs` | Tests, on Node's built-in runner. No model is called |
| `gwt-app/public/ai-governance-window-q3-2026-poster.svg` | The Q3 2026 poster |
| `gwt-app/public/ai-governance-window-q3-2026-motion-plate.html` | The Q3 2026 motion plate: an animated reading of the quarter, in one self-contained file |
| `vercel.json` | Build and function settings for Vercel |

The app keeps all signal data in your browser. Nothing you enter is stored on a server. Running a synthesis sends your signals through the app's server to the Anthropic API and returns a reading under the card.

## What is not in this repo yet

- The full tracker skill (v2.1). The prompt carries its status definitions, its per-domain anchors and three of its synthesis rules. The rest of the skill, including its signal registry, is not here.
- Earlier cycle cards.
- The quarterly assessments and their evidence records.
- Evidence gathering. The governed quarterly run searches for evidence in a separate step; the app does not.

These are published on the site:

- [The AI Governance Window in Q3 2026](https://www.systemsofthought.com/ai-governance-window-q3-2026/): the latest assessment of record.
- [The AI Governance Window](https://www.systemsofthought.com/governance/): definition, current status and the Q3 2026 poster.
- [The AI Governance Window Tracker](https://www.systemsofthought.com/tracker/): the hosted app, its limits and the changelog.
- [The AI Governance Window Tracked, Year to Date](https://www.systemsofthought.com/the-ai-governance-window-tracked-year-to-date/): the July 19, 2026 assessment.
- [From Skill to Instrument](https://www.systemsofthought.com/from-skill-to-instrument-the-making-of-the-ai-governance-window-tracker/): how the tracker was built.

## Run it locally

You need Node.js and an Anthropic API key.

```bash
cd gwt-app
npm install

# terminal 1: the API proxy, on http://localhost:3001
ANTHROPIC_API_KEY=your-key npm run proxy

# terminal 2: the app
npm run dev
```

The dev server forwards `/api` requests to the proxy. Without a key the app still runs and stores signals; only synthesis fails.

To run the tests, and to rebuild the generated files after changing anything in `method/`:

```bash
cd gwt-app
npm test

cd ..
node method/build-prompt.mjs
```

To deploy your own copy on Vercel, import the repo and set `ANTHROPIC_API_KEY` as a sensitive environment variable. `vercel.json` handles the rest.

The endpoint is public. It accepts signals only, caps each at 4,000 characters and rate-limits per IP, but that limit is counted per function instance. Add a Vercel Firewall rate-limit rule on `/api/synthesize` and set a spend limit on your Anthropic account.

## Known limits

- **A reading from the app is not an assessment of record.** It scores what you enter and gathers nothing. The quarterly assessments are produced by a separate, governed run.
- **The card covers one quarter.** After December 31, 2026 the app needs the next locked card.
- **The first method could register the window closing and could not register it opening.** It read "Narrowing, approaching Critical" in April 2026 and "Critical" in May. I rebuilt it in June 2026 so that an opening has to be defined in advance and can be scored.
- **The instrument leans toward the US and EU.** The democratic-capacity domain in particular reflects American institutions more than global ones.
- **A reading is only as good as the signals entered.** A signal you mark as unconfirmed is capped at low weight; everything else is taken as accurate.
- **Readings vary from run to run.** The model makes judgement calls and does not always make them the same way. In a handful of test runs on one three-signal board the status stayed the same, while one signal's weight and the near side of the margin changed.
- **The card leaves some closing clauses without a stated weight.** The app may under-weight those. I have seen it on O5.1(b), and will settle it at the next card lock.
- **Long boards can be cut off.** A run with many signals in every domain may exceed the reply limit, and the app will ask you to shorten them.
- **Assessments are drafted with an AI model made by Anthropic,** a company that appears in the evidence. The published assessments say how that conflict is handled.

## Roadmap

1. Separate fields for each signal's date and source.
2. A warning before unsaved drafts are lost.
3. Reset the reply and time limits from live timings.
4. Add the assessment records and earlier cycle cards to this repo.
5. Revisit how the prompt weights closing clauses, tested on several signals at once.

## Changelog

**Method update | October 4, 2026.** The app now runs tracker method v2.1. It scores signals against the locked October–December card and can return any of the five statuses. It opens on the Q3 result and reads new signals as movement from there. It does not search for evidence or verify what is entered.

**Fixes | October 4, 2026.** A saved signal can be cleared. A retry now tells the model why its first reply was not used. The page's footer and About note now say that running a synthesis sends your signals to the model.

---

MIT License · Built with AI-collaborative methods · Intellectual direction and authorial responsibility: Jedi Wright · Systems of Thought · UX Minds, LLC
