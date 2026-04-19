import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Locked schema — overrides whatever system prompt the frontend sends.
// Prevents key drift between runs by explicitly naming every required field.
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
  "most_consequential_signal": "name the single most important signal",
  "cross_domain_synthesis": "2-3 sentence synthesis of the cross-domain picture",
  "reversibility_assessment": "one sentence applying asymmetric reversibility weighting"
}

Apply asymmetric reversibility weighting — deterioration in epistemic infrastructure scores
worse than equivalent deterioration in regulatory capacity because it resists repair.`;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());

app.post('/api/synthesize', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY is not set in the server environment.' } });
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
});

app.listen(PORT, () => {
  console.log(`Anthropic proxy running on http://localhost:${PORT}`);
});
