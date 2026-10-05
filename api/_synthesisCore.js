// Shared synthesis core. Used by api/synthesize.js (the Vercel function) and by
// gwt-app/server.js (the local development server). Everything that decides what
// is sent to the model and what comes back lives here, once. Each host file keeps
// only what differs by host: routing, CORS, client address and body parsing.
//
// The leading underscore keeps Vercel from serving this file as its own endpoint.

import { CARD, BASELINE, SYSTEM_PROMPT } from './_method.js';

// ── Request policy ───────────────────────────────────────────────────────────
// The caller supplies signals and nothing else. The model, the system prompt,
// the reply format, the token ceiling and the message text are all set here.
const MODEL = 'claude-sonnet-5-5';
const METHOD = 'AI Governance Window Tracker v2.1.0';
const MAX_TOKENS = 4000;
// On this model, reasoning before the answer is on unless asked otherwise, and
// its tokens count against MAX_TOKENS: the first live run spent the whole
// ceiling before the reply finished. "between_tools" is the model's lowest
// thinking setting; with no tools in the request, the reply is text only.
// The card, the prompt's steps and the server's checks carry the method.
const THINKING = { type: 'between_tools' };
const EFFORT = 'medium';
const MAX_SIGNAL_CHARS = 4000;       // per domain
const MAX_BODY_BYTES = 32 * 1024;    // whole request body
const UPSTREAM_TIMEOUT_MS = 55_000;  // shared by the first attempt and the retry
const RETRY_MARGIN_MS = 2_000;

const MAX_SIGNALS_PER_DOMAIN = 5;    // the method's scope cap
const MIN_DOMAINS_FOR_STATUS = 3;    // ruling R5

// Per-IP limits; a request must pass every one.
const RATE_LIMITS = [
  { windowMs: 10 * 60 * 1000, max: 10 },
  { windowMs: 24 * 60 * 60 * 1000, max: 50 },
];
const MAX_TRACKED_IPS = 5000;

// Ids match DOMAINS in gwt-app/src/yjsStore.ts. Labels are the card's names.
const DOMAINS = [
  { id: 'regulatory', n: 1, label: 'Regulatory & Legal' },
  { id: 'technical', n: 2, label: 'Technical Embedding' },
  { id: 'capability', n: 3, label: 'Capability & Deployment' },
  { id: 'democratic', n: 4, label: 'Democratic Institutional Capacity' },
  { id: 'industry', n: 5, label: 'Industry Structure' },
];

// Fixed text, shown with every result. Not written by the model.
const DISCLOSURE = 'This reading was produced by an AI model made by Anthropic, from signals as they were entered. The app did not check them and ran no search. It is not the tracker\'s assessment of record. Where a signal names Anthropic, the model is scoring its own developer.';

// ── Allowed values ───────────────────────────────────────────────────────────
const STATUSES = ['Opening', 'Holding', 'Narrowing', 'Critical', 'Closed'];
const WEIGHTS = ['FULL', 'PARTIAL', 'LOW', 'ZERO'];
const PLACEMENTS = ['in_window', 'pre_window', 'post_window', 'undated'];
const BASES = ['referent', 'catalog', 'upr'];
const SIGNAL_DIRECTIONS = ['opening', 'closing', 'neither'];
const DOMAIN_DIRECTIONS = ['opening', 'holding', 'closing', 'contested'];
const VERIFICATIONS = ['as_entered', '?'];
const LENSES = ['predecessor-era', 'voluntary', 'deferred', 'contested', 'opaque-gate', 'embedding-as-governance-generative'];
const MOVES = ['up', 'down'];
const MARGIN_SIZES = ['thin', 'moderate', 'clear'];
const CONFIDENCES = ['low', 'low_medium', 'medium'];   // never "high" (ruling R10)
const JURISDICTIONS = ['eu', 'us_federal', 'us_states_courts', 'international'];
const JURISDICTION_VALUES = ['advancing', 'holding', 'retreating', 'fragmenting'];
const CLOCK_POSITIONS = ['early', 'mid', 'late'];
const RATES = ['accelerating', 'steady', 'decelerating'];
const INTERACTIONS = ['reinforcing', 'partially offsetting', 'independent'];
const GAP_DIRECTIONS = ['narrowing', 'stable', 'widening'];
const MOVEMENTS = ['toward_opening', 'no_change', 'toward_closing', 'not_enough_signals'];
const GUARDS = ['FG-1', 'FG-2', 'FG-3', 'FG-4', 'FG-5'];
const GUARD_RESULTS = ['satisfied', 'declared', 'not_applicable'];
const NET_PICTURES = ['net-positive', 'mixed', 'net-negative'];
const NONE = 'none';

// ── Rate limiting ────────────────────────────────────────────────────────────
// Counts are held in memory. On Vercel they apply per running function instance
// and reset on a cold start; on the local server they last for the life of the
// process. This slows a single caller; it is not a hard ceiling. The hard
// ceilings belong outside this file: a Vercel Firewall rate-limit rule on
// /api/synthesize and a spend limit on the API key.
const hits = new Map(); // ip -> request times (ms), oldest first

function checkRateLimit(ip, now = Date.now()) {
  const longest = Math.max(...RATE_LIMITS.map(l => l.windowMs));
  const recent = (hits.get(ip) ?? []).filter(t => now - t < longest);

  for (const { windowMs, max } of RATE_LIMITS) {
    const inWindow = recent.filter(t => now - t < windowMs);
    if (inWindow.length >= max) {
      hits.set(ip, recent);
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((inWindow[0] + windowMs - now) / 1000)) };
    }
  }

  recent.push(now);
  hits.delete(ip); // re-insert so the Map stays ordered by last use
  hits.set(ip, recent);

  // Bound memory: drop the least recently seen addresses first.
  for (const key of hits.keys()) {
    if (hits.size <= MAX_TRACKED_IPS) break;
    hits.delete(key);
  }
  return { ok: true };
}

function describeWait(seconds) {
  if (seconds < 90) return 'about a minute';
  if (seconds < 90 * 60) return `about ${Math.ceil(seconds / 60)} minutes`;
  return `about ${Math.ceil(seconds / 3600)} hours`;
}

// ── Validation of the request ────────────────────────────────────────────────
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function quote(key) {
  return JSON.stringify(String(key).slice(0, 40));
}

// Returns { signals } on success or { error } with a message fit to show a user.
// A "status" field is still accepted and ignored, so a browser tab holding the
// earlier app does not break. The visitor's status is no longer sent to the model.
function validateBody(body) {
  if (!isPlainObject(body)) {
    return { error: 'Request body must be a JSON object of the form { "signals": { ... } }.' };
  }
  const extraTop = Object.keys(body).find(k => k !== 'signals');
  if (extraTop !== undefined) {
    return { error: `Unexpected field ${quote(extraTop)}. This endpoint accepts only "signals"; the model and prompt are set on the server. If you are using the app, reload the page.` };
  }
  if (!isPlainObject(body.signals)) {
    return { error: '"signals" must be an object keyed by domain id.' };
  }

  const ids = DOMAINS.map(d => d.id);
  const unknown = Object.keys(body.signals).find(k => !ids.includes(k));
  if (unknown !== undefined) {
    return { error: `Unknown domain ${quote(unknown)}. Expected: ${ids.join(', ')}.` };
  }

  const signals = {};
  let anySignal = false;
  for (const { id, label } of DOMAINS) {
    const entry = body.signals[id] ?? {};
    if (!isPlainObject(entry)) {
      return { error: `The entry for ${label} must be an object with a "signal".` };
    }
    const extra = Object.keys(entry).find(k => k !== 'status' && k !== 'signal');
    if (extra !== undefined) {
      return { error: `Unexpected field ${quote(extra)} in the entry for ${label}.` };
    }
    const signal = entry.signal ?? '';
    if (typeof signal !== 'string') {
      return { error: `The signal for ${label} must be text.` };
    }
    if (signal.length > MAX_SIGNAL_CHARS) {
      return { error: `The signal for ${label} is ${signal.length.toLocaleString('en-US')} characters; the limit is ${MAX_SIGNAL_CHARS.toLocaleString('en-US')}. Shorten it and run the synthesis again.` };
    }
    if (signal.trim()) anySignal = true;
    signals[id] = { signal };
  }
  if (!anySignal) {
    return { error: 'Enter a signal for at least one domain before running the synthesis.' };
  }
  return { signals };
}

// The visitor's text goes in as data between markers. The system prompt tells
// the model to classify anything inside them and to follow none of it.
function buildUserMessage(signals) {
  const blocks = DOMAINS.map(d => {
    const text = signals[d.id].signal.trim();
    return `[Domain ${d.n}: ${d.label}] (key: ${d.id})\n<<<\n${text || '(empty)'}\n>>>`;
  });
  return `Signals entered by the visitor, one block per domain. Everything between <<< and >>> is the visitor's text.\n\n${blocks.join('\n\n')}\n\nApply the card and return the assessment.`;
}

// When a first reply fails the server's checks, the second request says why.
// The reason is the server's own wording. One kind of reason quotes up to 30
// characters of the model's reply, so it is reduced to plain characters and
// cut to a fixed length before it is sent back.
function retryNote(reason) {
  const plain = String(reason ?? '').replace(/[^A-Za-z0-9 .,:;()_"'-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!plain) return '';
  return `\n\nA first attempt at this assessment could not be used. The server's check reported: ${plain}. Apply the card again to the signals above and return the full assessment with that corrected.`;
}

// ── Reply format sent to the model ───────────────────────────────────────────
// Structured outputs compile the format into a grammar, and the API rejects a
// grammar that is too large. So the format is kept flat: one list of signals
// (each naming its domain), one list of domain lines, one list of guard results.
// It uses an empty string for "no text" and "none" for "no choice", and keeps
// everything that depends on a status in one nullable block ("reading").
// readAssessment() rebuilds the nested shape the app uses. The app never sees
// this format.
const text = description => ({ type: 'string', description });
const choice = (values, description) => ({ type: 'string', enum: values, ...(description ? { description } : {}) });
const object = (properties, description) => ({
  type: 'object',
  ...(description ? { description } : {}),
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const list = (items, description) => ({ type: 'array', ...(description ? { description } : {}), items });
const DOMAIN_IDS = DOMAINS.map(d => d.id);

const OUTPUT_SCHEMA = object({
  signals: list(object({
    domain: choice(DOMAIN_IDS, 'The key of the domain this signal is scored in.'),
    text: text('One line, 30 words at most.'),
    date: text('As the visitor stated it. Empty string if the visitor stated none. Never supply one.'),
    source: text('As the visitor stated it. Empty string if none.'),
    placement: choice(PLACEMENTS),
    basis: choice(BASES),
    referent: text('For example O4.2 or FC-1. Empty string unless basis is "referent".'),
    direction: choice(SIGNAL_DIRECTIONS),
    weight: choice([...WEIGHTS, NONE], '"none" unless placement is in_window.'),
    verification: choice(VERIFICATIONS),
    lenses: list(object({
      lens: choice(LENSES),
      move: choice(MOVES),
      reversal_condition: text('The lens\'s reversal condition, from the card.'),
    })),
    note: text('30 words at most. Empty string if none.'),
  }), 'Every signal, in domain order. At most 5 per domain. Empty if there are none.'),
  domains: list(object({
    domain: choice(DOMAIN_IDS),
    signals_dropped: { type: 'integer', description: 'Signals found beyond the 5 kept.' },
    direction: choice([...DOMAIN_DIRECTIONS, NONE], '"none" if the domain has no in_window signal at FULL or PARTIAL.'),
    key_signal: text('Empty string if the domain has no signal.'),
  }), 'One line for each of the five domains.'),
  reading: {
    description: 'Null when fewer than three domains have an in_window signal classified opening or closing (Step 9).',
    anyOf: [{ type: 'null' }, object({
      window_status: choice(STATUSES),
      closed_scope: text('The sector or jurisdiction, if the status is Closed. Otherwise an empty string.'),
      margin_size: choice(MARGIN_SIZES),
      margin_nearest: choice(STATUSES, 'The adjacent status this reading is nearest.'),
      confidence: choice(CONFIDENCES),
      rationale: text('Why this status and not the adjacent ones. 70 words at most.'),
      what_would_change: list(object({ condition: text('An observation.'), result: text('The status it would force.') }), 'One to three.'),
      upr_sensitivity: text('The status if every UPR observation were weighted PARTIAL. One sentence.'),
      could_have_differed: text('Which referents fired, and whether the status could have come out otherwise. One sentence.'),
      jurisdiction_eu: choice([...JURISDICTION_VALUES, NONE], '"none" if no scored hit bears on it.'),
      jurisdiction_us_federal: choice([...JURISDICTION_VALUES, NONE]),
      jurisdiction_us_states_courts: choice([...JURISDICTION_VALUES, NONE]),
      jurisdiction_international: choice([...JURISDICTION_VALUES, NONE]),
      embedding_clock_position: choice(CLOCK_POSITIONS),
      embedding_clock_rate: choice(RATES),
      embedding_clock_detail: text('One sentence.'),
      erosion_clock_position: choice(CLOCK_POSITIONS, 'The institutional-erosion clock.'),
      erosion_clock_rate: choice(RATES),
      erosion_clock_detail: text('One sentence.'),
      clock_interaction: choice(INTERACTIONS),
      gap_direction: choice(GAP_DIRECTIONS, 'The binding-authority gap.'),
      gap_detail: text('One sentence.'),
    })],
  },
  movement: choice(MOVEMENTS, 'Since the baseline. Use not_enough_signals when reading is null.'),
  what_changed: text('What the in_window signals change, by domain.'),
  what_held: text('What they leave as the baseline has it.'),
  fudge_guards: list(object({
    guard: choice(GUARDS),
    result: choice(GUARD_RESULTS),
    note: text('One sentence.'),
  }), 'One entry for each of FG-1 to FG-5.'),
  override_declared: { type: 'boolean', description: 'True if a synthesis-visibility declaration is made: required when F-1 fires and the status is Narrowing or worse.' },
  override_net_picture: choice(NET_PICTURES, 'Net domain picture this cycle.'),
  override_applied: text('The override applied. Empty string if none is declared.'),
  override_discounted: text('The opening-hit or gain discounted. Empty string if none is declared.'),
  override_why: text('Why the override holds. Empty string if none is declared.'),
  most_consequential_signal: text('Empty string if there is no signal.'),
  cross_domain_synthesis: text('70 words at most.'),
  reversibility: text('Irreversible losses and irreversible gains, both directions. One sentence.'),
  anthropic_named: { type: 'boolean' },
});

// ── Reading the model's reply ────────────────────────────────────────────────
// Returns { assessment } in the shape the app uses, or { problem } naming the
// first thing wrong. Enum values are matched without regard to case, because
// structured outputs do not guarantee capitalisation.
function readAssessment(wire) {
  const problems = [];
  const bad = (path, why) => { problems.push(`${path}: ${why}`); return undefined; };

  const str = (v, path) => (typeof v === 'string' ? v.trim() : bad(path, 'not text'));
  const optStr = (v, path) => {
    const s = str(v, path);
    if (s === undefined) return undefined;
    return s === '' || s.toLowerCase() === 'null' ? null : s;
  };
  const pick = (v, allowed, path) => {
    if (typeof v !== 'string') return bad(path, 'not text');
    const hit = allowed.find(a => a.toLowerCase() === v.trim().toLowerCase());
    return hit === undefined ? bad(path, `"${v.slice(0, 30)}" is not allowed`) : hit;
  };
  const optPick = (v, allowed, path) => {
    if (v === null || (typeof v === 'string' && [NONE, '', 'null'].includes(v.trim().toLowerCase()))) return null;
    return pick(v, allowed, path);
  };
  const int = (v, path) => (Number.isInteger(v) && v >= 0 ? v : bad(path, 'not a whole number'));
  const bool = (v, path) => (typeof v === 'boolean' ? v : bad(path, 'not true or false'));
  const obj = (v, path) => (isPlainObject(v) ? v : (bad(path, 'missing'), {}));
  const arr = (v, path) => (Array.isArray(v) ? v : (bad(path, 'not a list'), []));
  const root = obj(wire, 'reply');

  const domains = Object.fromEntries(DOMAIN_IDS.map(id => [id, { signals: [], signals_dropped: 0, direction: null, key_signal: null }]));
  arr(root.signals, 'signals').forEach((raw, i) => {
    const p = `signals[${i}]`;
    const s = obj(raw, p);
    const id = pick(s.domain, DOMAIN_IDS, `${p}.domain`);
    const signal = {
      text: str(s.text, `${p}.text`),
      date: optStr(s.date, `${p}.date`),
      source: optStr(s.source, `${p}.source`),
      placement: pick(s.placement, PLACEMENTS, `${p}.placement`),
      basis: pick(s.basis, BASES, `${p}.basis`),
      referent: optStr(s.referent, `${p}.referent`),
      direction: pick(s.direction, SIGNAL_DIRECTIONS, `${p}.direction`),
      weight: optPick(s.weight, WEIGHTS, `${p}.weight`),
      verification: pick(s.verification, VERIFICATIONS, `${p}.verification`),
      lenses: arr(s.lenses, `${p}.lenses`).map((rawLens, j) => {
        const l = obj(rawLens, `${p}.lenses[${j}]`);
        return {
          lens: pick(l.lens, LENSES, `${p}.lenses[${j}].lens`),
          move: pick(l.move, MOVES, `${p}.lenses[${j}].move`),
          reversal_condition: str(l.reversal_condition, `${p}.lenses[${j}].reversal_condition`),
          searched: 'not searched',   // always, in this app: no search is run
        };
      }),
      note: optStr(s.note, `${p}.note`),
    };
    if (id) domains[id].signals.push(signal);
  });
  arr(root.domains, 'domains').forEach((raw, i) => {
    const p = `domains[${i}]`;
    const d = obj(raw, p);
    const id = pick(d.domain, DOMAIN_IDS, `${p}.domain`);
    if (!id) return;
    domains[id].signals_dropped = int(d.signals_dropped, `${p}.signals_dropped`);
    domains[id].direction = optPick(d.direction, DOMAIN_DIRECTIONS, `${p}.direction`);
    domains[id].key_signal = optStr(d.key_signal, `${p}.key_signal`);
  });

  const r = root.reading === null || root.reading === undefined ? null : obj(root.reading, 'reading');
  let reading = {
    window_status: null, closed_scope: null, margin: null, confidence: null, rationale: null,
    what_would_change: [], upr_sensitivity: null, could_have_differed: null, jurisdictions: null,
    embedding_clock: null, erosion_clock: null, clock_interaction: null, binding_authority_gap: null,
  };
  if (r) {
    const readClock = name => ({
      position: pick(r[`${name}_position`], CLOCK_POSITIONS, `reading.${name}_position`),
      rate: pick(r[`${name}_rate`], RATES, `reading.${name}_rate`),
      detail: str(r[`${name}_detail`], `reading.${name}_detail`),
    });
    reading = {
      window_status: pick(r.window_status, STATUSES, 'reading.window_status'),
      closed_scope: optStr(r.closed_scope, 'reading.closed_scope'),
      margin: { size: pick(r.margin_size, MARGIN_SIZES, 'reading.margin_size'), nearest: pick(r.margin_nearest, STATUSES, 'reading.margin_nearest') },
      confidence: pick(r.confidence, CONFIDENCES, 'reading.confidence'),
      rationale: str(r.rationale, 'reading.rationale'),
      what_would_change: arr(r.what_would_change, 'reading.what_would_change').map((raw, i) => {
        const w = obj(raw, `reading.what_would_change[${i}]`);
        return { if: str(w.condition, `reading.what_would_change[${i}].condition`), then: str(w.result, `reading.what_would_change[${i}].result`) };
      }),
      upr_sensitivity: optStr(r.upr_sensitivity, 'reading.upr_sensitivity'),
      could_have_differed: optStr(r.could_have_differed, 'reading.could_have_differed'),
      jurisdictions: Object.fromEntries(JURISDICTIONS.map(k => [k, optPick(r[`jurisdiction_${k}`], JURISDICTION_VALUES, `reading.jurisdiction_${k}`)])),
      embedding_clock: readClock('embedding_clock'),
      erosion_clock: readClock('erosion_clock'),
      clock_interaction: pick(r.clock_interaction, INTERACTIONS, 'reading.clock_interaction'),
      binding_authority_gap: { direction: pick(r.gap_direction, GAP_DIRECTIONS, 'reading.gap_direction'), detail: str(r.gap_detail, 'reading.gap_detail') },
    };
  }

  const guardEntries = arr(root.fudge_guards, 'fudge_guards');
  const fudgeGuards = Object.fromEntries(GUARDS.map(g => {
    const entry = guardEntries.find(e => isPlainObject(e) && typeof e.guard === 'string' && e.guard.trim().toUpperCase() === g);
    if (!entry) return [g, bad(`fudge_guards.${g}`, 'missing')];
    return [g, { result: pick(entry.result, GUARD_RESULTS, `fudge_guards.${g}.result`), note: str(entry.note, `fudge_guards.${g}.note`) }];
  }));

  const assessment = {
    domains,
    ...reading,
    fudge_guards: fudgeGuards,
    // F-1 is recounted by the server in applyRules(); the model is not asked for it.
    f1: { domains_with_surviving_opening_hits: 0, fires: false },
    synthesis_visibility: bool(root.override_declared, 'override_declared') ? {
      net_picture: pick(root.override_net_picture, NET_PICTURES, 'override_net_picture'),
      override: str(root.override_applied, 'override_applied'),
      discounted: str(root.override_discounted, 'override_discounted'),
      why: str(root.override_why, 'override_why'),
    } : null,
    since_baseline: {
      movement: pick(root.movement, MOVEMENTS, 'movement'),
      what_changed: str(root.what_changed, 'what_changed'),
      what_held: str(root.what_held, 'what_held'),
    },
    most_consequential_signal: optStr(root.most_consequential_signal, 'most_consequential_signal'),
    cross_domain_synthesis: str(root.cross_domain_synthesis, 'cross_domain_synthesis'),
    reversibility: str(root.reversibility, 'reversibility'),
    anthropic_named: bool(root.anthropic_named, 'anthropic_named'),
  };
  return problems.length ? { problem: problems[0] } : { assessment };
}

// ── Rules the server enforces ────────────────────────────────────────────────
// Where a stated date names one year and month, the server can tell whether it
// falls outside the card's window. It only ever removes weight on this check;
// it never adds any.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
function statedYearMonth(date) {
  if (typeof date !== 'string') return null;
  const found = [];
  for (const m of date.matchAll(/\b(20\d\d)-(0[1-9]|1[0-2])(?:-\d\d)?\b/g)) found.push([Number(m[1]), Number(m[2])]);
  if (!found.length) {
    const years = [...date.matchAll(/\b(20\d\d)\b/g)].map(m => Number(m[1]));
    const months = [...date.toLowerCase().matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/g)].map(m => MONTHS.indexOf(m[1]) + 1);
    if (years.length === 1 && months.length === 1) found.push([years[0], months[0]]);
  }
  return found.length === 1 ? { year: found[0][0], month: found[0][1] } : null;
}

function placementFromDate(date) {
  const ym = statedYearMonth(date);
  if (!ym) return null;
  const key = ym.year * 100 + ym.month;
  const start = Number(CARD.window.start.slice(0, 4)) * 100 + Number(CARD.window.start.slice(5, 7));
  const end = Number(CARD.window.end.slice(0, 4)) * 100 + Number(CARD.window.end.slice(5, 7));
  if (key < start) return 'pre_window';
  if (key > end) return 'post_window';
  return 'in_window';
}

const WEIGHT_RANK = { FULL: 3, PARTIAL: 2, LOW: 1, ZERO: 0 };
const NARROWING_OR_WORSE = ['Narrowing', 'Critical', 'Closed'];

// Takes an assessment from readAssessment(). Returns { assessment, meta } with
// every rule below applied, or { problem } if the reply breaks a rule the server
// cannot repair. Each change the server makes is listed in meta.adjustments.
function applyRules(input, now = new Date()) {
  const a = structuredClone(input);
  const adjustments = [];
  const domainStates = {};
  let domainsCounted = 0;
  let domainsWithSurvivingOpeningHits = 0;
  let problem;

  for (const { id, n } of DOMAINS) {
    const d = a.domains[id];
    if (d.signals.length > MAX_SIGNALS_PER_DOMAIN) {
      const extra = d.signals.length - MAX_SIGNALS_PER_DOMAIN;
      d.signals = d.signals.slice(0, MAX_SIGNALS_PER_DOMAIN);
      d.signals_dropped += extra;
      adjustments.push(`Domain ${n}: ${extra} signal(s) beyond the cap of ${MAX_SIGNALS_PER_DOMAIN} were cut.`);
    }

    d.signals.forEach((s, i) => {
      const where = `Domain ${n}, signal ${i + 1}`;
      if (s.basis !== 'referent') s.referent = null;

      if (s.placement === 'in_window') {
        const byDate = s.date === null ? 'undated' : placementFromDate(s.date);
        if (byDate && byDate !== 'in_window') {
          s.placement = byDate;
          adjustments.push(`${where}: placed as ${byDate.replace('_', '-')} from its stated date; it carries no weight.`);
        }
      }
      if (s.placement !== 'in_window') {
        s.weight = null;
        return;
      }
      if (s.weight === null) {
        if (s.direction !== 'neither') problem ??= `${where} is in the window and classified ${s.direction} but has no weight`;
        return;
      }
      const cap = (limit, why) => {
        if (WEIGHT_RANK[s.weight] > WEIGHT_RANK[limit]) {
          adjustments.push(`${where}: weight ${s.weight} lowered to ${limit} (${why}).`);
          s.weight = limit;
        }
      };
      if (s.verification === '?') cap('LOW', 'marked unconfirmed by the visitor');
      if (s.basis === 'upr') cap('LOW', 'un-pre-registered observations are capped at LOW');
      if (s.basis === 'catalog') cap('PARTIAL', 'catalog signals are PARTIAL at most');
    });

    const inWindow = d.signals.filter(s => s.placement === 'in_window');
    domainStates[id] = d.signals.length === 0 ? 'no_data' : inWindow.length === 0 ? 'context_only' : 'scored';
    const counting = inWindow.filter(s => WEIGHT_RANK[s.weight] >= WEIGHT_RANK.PARTIAL);
    if (counting.length === 0 && d.direction !== null) {
      if (domainStates[id] === 'scored') adjustments.push(`Domain ${n}: direction removed; no in-window signal at FULL or PARTIAL.`);
      d.direction = null;
    }
    if (d.signals.length === 0) d.key_signal = null;
    if (inWindow.some(s => s.direction === 'opening' || s.direction === 'closing')) domainsCounted += 1;
    if (counting.some(s => s.direction === 'opening')) domainsWithSurvivingOpeningHits += 1;
  }
  if (problem) return { problem };

  // F-1 is counted by the server from the signals, not taken from the model.
  a.f1 = { domains_with_surviving_opening_hits: domainsWithSurvivingOpeningHits, fires: domainsWithSurvivingOpeningHits >= 2 };

  let statusWithheld = null;
  if (domainsCounted < MIN_DOMAINS_FOR_STATUS) {
    // Ruling R5: no new reading. The app keeps the baseline on screen.
    statusWithheld = { domains_counted: domainsCounted, required: MIN_DOMAINS_FOR_STATUS };
    Object.assign(a, {
      window_status: null, closed_scope: null, margin: null, confidence: null, rationale: null,
      what_would_change: [], upr_sensitivity: null, could_have_differed: null, jurisdictions: null,
      embedding_clock: null, erosion_clock: null, clock_interaction: null, binding_authority_gap: null,
      synthesis_visibility: null,
    });
    a.since_baseline.movement = 'not_enough_signals';
  } else {
    if (a.window_status === null) return { problem: `no status was returned although ${domainsCounted} domains have an in-window opening or closing signal` };
    if (a.since_baseline.movement === 'not_enough_signals') return { problem: 'movement reads "not enough signals" although a status was returned' };
    if (a.what_would_change.length === 0) return { problem: 'no "what would change the status" line was returned' };
    if (a.what_would_change.length > 3) a.what_would_change = a.what_would_change.slice(0, 3);
    if (a.window_status === 'Closed') {
      if (!a.closed_scope) return { problem: 'the status is Closed with no sector or jurisdiction named' };
    } else {
      a.closed_scope = null;
    }
    if (a.f1.fires && NARROWING_OR_WORSE.includes(a.window_status) && a.synthesis_visibility === null) {
      return { problem: `F-1 fires and the status is ${a.window_status}, with no synthesis-visibility declaration` };
    }
  }

  const meta = {
    card_id: CARD.id,
    card_sha256_prefix: CARD.sha256_prefix,
    window: CARD.window,
    method: METHOD,
    model: MODEL,
    generated_at: now.toISOString(),
    basis: 'as_entered',
    recall: 'recall-limited',
    domain_states: domainStates,
    status_withheld: statusWithheld,
    baseline: BASELINE,
    disclosure: DISCLOSURE,
    adjustments,
  };
  return { assessment: a, meta };
}

// ── Upstream call ────────────────────────────────────────────────────────────
// If the API refuses the reply format itself (for example, as too large to
// compile), the request is sent again with the format written into the message
// as text. The reply is then checked by readAssessment() and applyRules() exactly
// as before; only the API's own guarantee of the shape is lost. The refusal is
// remembered for the life of this instance, so later requests skip the failed call.
let structuredFormatRejected = false;
const FORMAT_AS_TEXT = `\n\nReturn one JSON object and nothing else. It must match this JSON Schema exactly, with every field present:\n${JSON.stringify(OUTPUT_SCHEMA)}`;

// One attempt. Returns { wire } (the parsed reply), { retryable: reason } for a
// reply the app cannot use, or { error: { status, body } } for anything a second
// attempt would not fix. Upstream detail is logged here, never sent to the caller.
async function attempt(apiKey, signals, timeoutMs, structured, earlierReason) {
  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(signals) + retryNote(earlierReason) + (structured ? '' : FORMAT_AS_TEXT) }],
        thinking: THINKING,
        output_config: {
          effort: EFFORT,
          ...(structured ? { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } } : {}),
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    console.error('[synthesize] upstream request failed:', err?.name, err?.message);
    return { error: timedOut
      ? { status: 504, body: errorBody('upstream_timeout', 'The model took too long to respond. Try again.') }
      : { status: 502, body: errorBody('upstream_unreachable', 'Could not reach the model service. Try again shortly.') } };
  }

  const data = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    console.error('[synthesize] upstream error:', upstream.status, data?.error?.type, data?.error?.message);
    if (structured && upstream.status === 400 && /grammar|schema|output_config\.format|structured output/i.test(String(data?.error?.message))) {
      return { formatRejected: true };
    }
    if (upstream.status === 429 || upstream.status === 529) {
      return { error: { status: 503, body: errorBody('upstream_busy', 'The model service is busy. Try again in a minute.') } };
    }
    return { error: { status: 502, body: errorBody('upstream_error', 'The model service returned an error. Try again shortly.') } };
  }

  console.info('[synthesize] usage:', JSON.stringify({ input: data?.usage?.input_tokens, output: data?.usage?.output_tokens, stop: data?.stop_reason, format: structured ? 'structured' : 'prompt_only', blocks: Array.isArray(data?.content) ? data.content.map(b => b?.type) : [], detail: data?.usage }));

  // A reply that hit the token ceiling is cut off mid-JSON. A second attempt
  // would hit the same ceiling, so this is not retried.
  if (data?.stop_reason === 'max_tokens') {
    console.error('[synthesize] upstream reply truncated at max_tokens');
    return { error: { status: 502, body: errorBody('upstream_truncated', 'The assessment was cut off before it finished. Shorten the signals and run the synthesis again.') } };
  }
  if (data?.stop_reason === 'refusal') return { retryable: 'the model declined to answer' };

  const reply = Array.isArray(data?.content) ? data.content.find(b => b?.type === 'text')?.text : undefined;
  if (typeof reply !== 'string' || !reply) return { retryable: `no text block in the reply (stop_reason ${data?.stop_reason})` };

  let wire;
  try {
    wire = JSON.parse(reply);
  } catch {
    const match = reply.match(/\{[\s\S]*\}/);
    try { wire = match ? JSON.parse(match[0]) : undefined; } catch { wire = undefined; }
  }
  if (!isPlainObject(wire)) return { retryable: `the reply was not a JSON object (length ${reply.length})` };
  return { wire };
}

// Returns { status, body }. On success the body is { assessment, meta }.
// An unusable reply is retried once, and only if the first attempt left enough
// of the time budget for a second attempt of the same length. The second
// request tells the model why the first reply was not used.
async function callAnthropic(apiKey, signals) {
  const started = Date.now();
  const deadline = started + UPSTREAM_TIMEOUT_MS;
  let reason = 'unknown';
  let earlierReason = '';

  for (let n = 1; n <= 2; n++) {
    const attemptStarted = Date.now();
    let result = await attempt(apiKey, signals, deadline - attemptStarted, !structuredFormatRejected, earlierReason);
    if (result.formatRejected) {
      console.error('[synthesize] the API refused the reply format; sending it as text instead');
      structuredFormatRejected = true;
      result = await attempt(apiKey, signals, deadline - Date.now(), false, earlierReason);
    }
    if (result.error) return result.error;

    if (result.wire) {
      const read = readAssessment(result.wire);
      const ruled = read.problem ? read : applyRules(read.assessment);
      if (!ruled.problem) return { status: 200, body: { assessment: ruled.assessment, meta: ruled.meta } };
      reason = ruled.problem;
    } else {
      reason = result.retryable;
    }
    console.error(`[synthesize] attempt ${n}: unusable reply: ${reason}`);
    earlierReason = reason;

    const took = Date.now() - attemptStarted;
    if (n === 1 && deadline - Date.now() < took + RETRY_MARGIN_MS) {
      console.error('[synthesize] no retry: not enough time left');
      break;
    }
  }
  return { status: 502, body: errorBody('upstream_malformed', 'The model returned an assessment the app could not use. Run the synthesis again.') };
}

function errorBody(code, message) {
  return { error: { code, message } };
}

export {
  MAX_BODY_BYTES,
  checkRateLimit,
  describeWait,
  isPlainObject,
  validateBody,
  callAnthropic,
  retryNote,
  errorBody,
  DOMAINS,
  DISCLOSURE,
  OUTPUT_SCHEMA,
  buildUserMessage,
  readAssessment,
  applyRules,
  placementFromDate,
};
