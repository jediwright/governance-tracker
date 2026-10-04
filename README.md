# AI Governance Window Tracker

A local-first web app for assessing whether the window for binding democratic AI governance is opening or closing, across five domains.

> **Status, October 2026: this app is not the current instrument.**
> The code here runs the original April 2026 method. I rebuilt the method in June 2026 because the original could only ever return "Narrowing". The rebuild has not been ported to this app. Treat anything the app produces as a demonstration, not as a current assessment.
>
> **Latest assessment:** Q3 2026 (July 1 to September 30). Status: **Narrowing, by a thin margin.**
> Poster and status: [The AI Governance Window](https://www.systemsofthought.com/governance/)

<a href="gwt-app/public/ai-governance-window-q3-2026-motion-plate.html"><img src="gwt-app/public/ai-governance-window-q3-2026-poster.svg" alt="The AI Governance Window Tracker, calendar Q3 2026 poster: Narrowing, by a thin margin."></a>

*The calendar Q3 2026 poster. The image links to the motion plate, a single HTML file in this repo: download it and open it in a browser to play it.*

## What the window is

The AI governance window is the period, roughly now to 2030, in which binding democratic governance of AI is still structurally possible. Two clocks run against it. One measures how deeply AI is embedding in critical infrastructure. The other measures how much capacity democratic institutions still have to impose and enforce rules. The window is the gap between them.

I assess it across five domains: regulatory and legal, technical embedding, capability and deployment, democratic institutional capacity, and industry structure. The result is one of five states: Opening, Holding, Narrowing, Critical or Closed.

## What is in this repo

| Path | What it is |
|:---|:---|
| `gwt-app/` | The web app: Vite, React and TypeScript, with Yjs and IndexedDB for local-first storage |
| `gwt-app/server.js` | A local server for development. It validates the signals, builds the request and calls the Anthropic API |
| `api/synthesize.js` | The same endpoint as a Vercel serverless function, for production |
| `gwt-app/public/ai-governance-window-q3-2026-poster.svg` | The Q3 2026 poster |
| `gwt-app/public/ai-governance-window-q3-2026-motion-plate.html` | The Q3 2026 motion plate: an animated reading of the quarter, in one self-contained file |
| `vercel.json` | Build and function settings for Vercel |

The app keeps all signal data in your browser. Nothing you enter is stored on a server. Running a synthesis sends your signals to the Anthropic API and returns a cross-domain verdict.

## What is not in this repo yet

- The rebuilt method (the tracker skill, v2.1).
- The cycle cards that commit, before each cycle, to what would count as the window opening.
- The quarterly assessments and their evidence records.

For now these are published on the site:

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

To deploy your own copy on Vercel, import the repo and set `ANTHROPIC_API_KEY` as a sensitive environment variable. `vercel.json` handles the rest.

The endpoint is public. It accepts signals only, caps each at 4,000 characters and rate-limits per IP, but that limit is counted per function instance. Add a Vercel Firewall rate-limit rule on `/api/synthesize` and set a spend limit on your Anthropic account.

## Known limits

- **The method is the April 2026 one.** See the status note at the top.
- **The instrument leans toward the US and EU.** The democratic-capacity domain in particular reflects American institutions more than global ones.
- **A verdict is only as good as the signals entered.** The app does not gather evidence. It synthesises what you give it.
- **Assessments are drafted with an AI model made by Anthropic,** a company that appears in the evidence. The published assessments say how that conflict is handled.

## Roadmap

1. Port the rebuilt method to the app.
2. Add the cycle cards and assessment records to this repo.
3. Align cycles to calendar quarters.

---

MIT License · Built with AI-collaborative methods · Intellectual direction and authorial responsibility: Jedi Wright · Systems of Thought · UX Minds, LLC
