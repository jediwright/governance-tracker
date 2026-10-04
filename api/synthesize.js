const SYSTEM_PROMPT = `You are the AI Governance Window Tracker, a structured assessment instrument
monitoring whether the window for binding democratic AI governance is narrowing or closing.
You operate on the binding-authority gap framework, the dual-clock structure (Embedding Clock
and Institutional Erosion Clock), and the asymmetric reversibility principle (epistemic losses
are ratchets; institutional losses are imperfectly recoverable).

Given domain signal inputs across five monitoring domains, return ONLY a JSON object with
exactly these keys — no extra keys, no prose wrapper:

{
  "window_status": "Opening | Holding | Narrowing | Critical | Closed",
  "window_trajectory": "one-line direction of travel",
  "embedding_clock": {
    "position": "Early | Mid | Late",
    "rate_of_movement": "Accelerating | Steady | Slowing",
    "detail": "one sentence"
  },
  "institutional_erosion_clock": {
    "position": "Early | Mid | Late",
    "rate_of_movement": "Accelerating | Steady | Slowing",
    "detail": "one sentence"
  },
  "binding_authority_gap": {
    "direction": "Narrowing | Stable | Widening",
    "detail": "one sentence"
  },
  "domain_statuses": {
    "regulatory_legal": "REQUIRED: one of Opening|Holding|Narrowing|Critical|Closed",
    "technical_embedding": "REQUIRED: one of Opening|Holding|Narrowing|Critical|Closed",
    "capability_acceleration": "REQUIRED: one of Opening|Holding|Narrowing|Critical|Closed",
    "democratic_capacity": "REQUIRED: one of Opening|Holding|Narrowing|Critical|Closed",
    "industry_structure": "REQUIRED: one of Opening|Holding|Narrowing|Critical|Closed"
  },
  "most_consequential_signal": "name the single most important signal",
  "cross_domain_synthesis": "2-3 sentence synthesis of the cross-domain picture",
  "reversibility_assessment": "one sentence applying asymmetric reversibility weighting"
}

Apply asymmetric reversibility weighting — deterioration in epistemic infrastructure scores
worse than equivalent deterioration in regulatory capacity because it resists repair.`;

// ── Request policy ───────────────────────────────────────────────────────────
// The caller supplies signals and nothing else. The model, the system prompt,
// the token ceiling and the message text are all set here, on the server.
const MODEL = 'claude-sonnet-5-5';
const MAX_TOKENS = 2000;
const MAX_SIGNAL_CHARS = 4000;       // per domain
const MAX_BODY_BYTES = 32 * 1024;    // whole request body
const UPSTREAM_TIMEOUT_MS = 25_000;

// Per-IP limits; a request must pass every one.
const RATE_LIMITS = [
  { windowMs: 10 * 60 * 1000, max: 10 },
  { windowMs: 24 * 60 * 60 * 1000, max: 50 },
];
const MAX_TRACKED_IPS = 5000;

// Keep in sync with DOMAINS in gwt-app/src/yjsStore.ts.
const DOMAINS = [
  { id: 'regulatory', label: 'Regulatory & Legal Frameworks' },
  { id: 'technical', label: 'Technical Embedding' },
  { id: 'capability', label: 'Capability Acceleration' },
  { id: 'democratic', label: 'Democratic Institutional Capacity' },
  { id: 'industry', label: 'Industry Structure & Power' },
];
const STATUSES = ['Opening', 'Holding', 'Narrowing', 'Critical', 'Closed'];

// ── Rate limiting ────────────────────────────────────────────────────────────
// Counts are held in memory, so they apply per running function instance and
// reset on a cold start. This slows a single caller; it is not a hard ceiling.
// The hard ceilings belong outside this file: a Vercel Firewall rate-limit rule
// on /api/synthesize and a spend limit on the API key.
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

// ── Validation ───────────────────────────────────────────────────────────────
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function quote(key) {
  return JSON.stringify(String(key).slice(0, 40));
}

// Returns { signals } on success or { error } with a message fit to show a user.
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
      return { error: `The entry for ${label} must be an object with "status" and "signal".` };
    }
    const extra = Object.keys(entry).find(k => k !== 'status' && k !== 'signal');
    if (extra !== undefined) {
      return { error: `Unexpected field ${quote(extra)} in the entry for ${label}.` };
    }
    const status = entry.status ?? null;
    if (status !== null && !STATUSES.includes(status)) {
      return { error: `The status for ${label} must be one of ${STATUSES.join(', ')}, or null.` };
    }
    const signal = entry.signal ?? '';
    if (typeof signal !== 'string') {
      return { error: `The signal for ${label} must be text.` };
    }
    if (signal.length > MAX_SIGNAL_CHARS) {
      return { error: `The signal for ${label} is ${signal.length.toLocaleString('en-US')} characters; the limit is ${MAX_SIGNAL_CHARS.toLocaleString('en-US')}. Shorten it and run the synthesis again.` };
    }
    if (signal.trim()) anySignal = true;
    signals[id] = { status, signal };
  }
  if (!anySignal) {
    return { error: 'Enter a signal for at least one domain before running the synthesis.' };
  }
  return { signals };
}

// Same text the app used to build in the browser, now built from validated input.
function buildUserMessage(signals) {
  const domainSummary = DOMAINS.map(d => {
    const s = signals[d.id];
    return `${d.label}: status=${s.status}, signal="${s.signal || 'none'}"`;
  }).join('\n');
  return `Current domain signal inputs:\n${domainSummary}\n\nProduce the structured assessment JSON.`;
}

// ── Upstream call ────────────────────────────────────────────────────────────
// Returns { status, body }. Upstream detail is logged here, never sent to the caller.
async function callAnthropic(apiKey, signals) {
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
        messages: [{ role: 'user', content: buildUserMessage(signals) }],
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    console.error('[synthesize] upstream request failed:', err?.name, err?.message);
    return timedOut
      ? { status: 504, body: errorBody('upstream_timeout', 'The model took too long to respond. Try again.') }
      : { status: 502, body: errorBody('upstream_unreachable', 'Could not reach the model service. Try again shortly.') };
  }

  const data = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    console.error('[synthesize] upstream error:', upstream.status, data?.error?.type, data?.error?.message);
    if (upstream.status === 429 || upstream.status === 529) {
      return { status: 503, body: errorBody('upstream_busy', 'The model service is busy. Try again in a minute.') };
    }
    return { status: 502, body: errorBody('upstream_error', 'The model service returned an error. Try again shortly.') };
  }

  const text = Array.isArray(data?.content) ? data.content.find(b => b?.type === 'text')?.text : undefined;
  if (typeof text !== 'string' || !text) {
    console.error('[synthesize] upstream response had no text block; stop_reason:', data?.stop_reason);
    return { status: 502, body: errorBody('upstream_empty', 'The model returned no assessment. Try again.') };
  }
  return { status: 200, body: { content: [{ type: 'text', text }] } };
}

function errorBody(code, message) {
  return { error: { code, message } };
}

function clientIp(req) {
  // Vercel sets both headers itself; a caller cannot supply their own.
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real) return real;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
  'https://systemsofthought.com',
  'https://www.systemsofthought.com',
  'https://jediwright.com',
  'https://www.jediwright.com',
  'https://governance-tracker-eight.vercel.app'
];

const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json(errorBody('method_not_allowed', 'Use POST.'));
  }

  const limit = checkRateLimit(clientIp(req));
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfterSec));
    return res.status(429).json(errorBody('rate_limited', `Too many synthesis requests from this address. Try again in ${describeWait(limit.retryAfterSec)}.`));
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[synthesize] ANTHROPIC_API_KEY is not set.');
    return res.status(500).json(errorBody('not_configured', 'Synthesis is not configured on this server.'));
  }

  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) {
    return res.status(413).json(errorBody('too_large', `Request is too large. The limit is ${MAX_BODY_BYTES / 1024} KB.`));
  }
  if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
    return res.status(415).json(errorBody('unsupported_media_type', 'Send the request as application/json.'));
  }

  let body;
  try {
    body = req.body; // Vercel parses on first access and throws on malformed JSON
  } catch {
    return res.status(400).json(errorBody('invalid_json', 'Request body is not valid JSON.'));
  }
  // Backstop for requests sent without a Content-Length header.
  if (isPlainObject(body) && Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) {
    return res.status(413).json(errorBody('too_large', `Request is too large. The limit is ${MAX_BODY_BYTES / 1024} KB.`));
  }

  const checked = validateBody(body);
  if (checked.error) {
    return res.status(400).json(errorBody('invalid_request', checked.error));
  }

  const result = await callAnthropic(apiKey, checked.signals);
  return res.status(result.status).json(result.body);
}
