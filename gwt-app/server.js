import express from 'express';
import cors from 'cors';
import {
  MAX_BODY_BYTES,
  checkRateLimit,
  describeWait,
  validateBody,
  callAnthropic,
  errorBody,
} from '../api/_synthesisCore.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json({ limit: MAX_BODY_BYTES }));

app.post('/api/synthesize', async (req, res) => {
  const limit = checkRateLimit(req.ip ?? 'unknown');
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfterSec));
    return res.status(429).json(errorBody('rate_limited', `Too many synthesis requests from this address. Try again in ${describeWait(limit.retryAfterSec)}.`));
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json(errorBody('not_configured', 'ANTHROPIC_API_KEY is not set in the server environment.'));
  }

  if (!req.is('application/json')) {
    return res.status(415).json(errorBody('unsupported_media_type', 'Send the request as application/json.'));
  }

  const checked = validateBody(req.body);
  if (checked.error) {
    return res.status(400).json(errorBody('invalid_request', checked.error));
  }

  const result = await callAnthropic(apiKey, checked.signals);
  return res.status(result.status).json(result.body);
});

// Body-parser failures (oversized or malformed JSON) and anything unexpected.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err?.type === 'entity.too.large') {
    return res.status(413).json(errorBody('too_large', `Request is too large. The limit is ${MAX_BODY_BYTES / 1024} KB.`));
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json(errorBody('invalid_json', 'Request body is not valid JSON.'));
  }
  console.error('[synthesize] unexpected error:', err);
  return res.status(500).json(errorBody('server_error', 'Something went wrong on the server.'));
});

app.listen(PORT, () => {
  console.log(`Anthropic proxy running on http://localhost:${PORT}`);
});
