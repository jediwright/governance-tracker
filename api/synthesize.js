import {
  MAX_BODY_BYTES,
  checkRateLimit,
  describeWait,
  isPlainObject,
  validateBody,
  callAnthropic,
  errorBody,
} from './_synthesisCore.js';

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
