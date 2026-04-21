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
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY is not set.' } });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ ...req.body, system: SYSTEM_PROMPT, max_tokens: 2000 }),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: { message: err.message } });
  }
}
