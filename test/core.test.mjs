// Run from gwt-app with: npm test
// Uses Node's built-in test runner. No model is called: replies are canned.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as core from '../api/_synthesisCore.js';
import { CARD, BASELINE, SYSTEM_PROMPT } from '../api/_method.js';
import handler from '../api/synthesize.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── Canned replies, in the format the model is asked for ─────────────────────
const sig = (o = {}) => ({
  text: 'A thing happened', date: '2026-11-03', source: '', placement: 'in_window', basis: 'referent',
  referent: 'O1.1', direction: 'opening', weight: 'FULL', verification: 'as_entered', lenses: [], note: '', ...o,
});
const dom = (signals = [], direction = 'none') => ({ signals, signals_dropped: 0, direction, key_signal: signals.length ? 'k' : '' });
const reading = (o = {}) => ({
  window_status: 'Holding', closed_scope: '', margin: { size: 'thin', nearest: 'Narrowing' }, confidence: 'low',
  rationale: 'r', what_would_change: [{ condition: 'c', result: 'Opening' }], upr_sensitivity: 'u', could_have_differed: 'd',
  jurisdictions: { eu: 'advancing', us_federal: 'none', us_states_courts: 'holding', international: 'none' },
  embedding_clock: { position: 'mid', rate: 'steady', detail: 'x' }, erosion_clock: { position: 'mid', rate: 'steady', detail: 'x' },
  clock_interaction: 'independent', binding_authority_gap: { direction: 'stable', detail: 'x' }, ...o,
});
const wire = (domains = {}, rd = reading(), o = {}) => ({
  domains: { regulatory: dom(), technical: dom(), capability: dom(), democratic: dom(), industry: dom(), ...domains },
  reading: rd,
  since_baseline: { movement: rd ? 'no_change' : 'not_enough_signals', what_changed: 'a', what_held: 'b' },
  fudge_guards: Object.fromEntries(['FG-1', 'FG-2', 'FG-3', 'FG-4', 'FG-5'].map(g => [g, { result: 'satisfied', note: 'n' }])),
  f1: { domains_with_surviving_opening_hits: 9, fires: false },
  synthesis_visibility: null, most_consequential_signal: 'm', cross_domain_synthesis: 'c', reversibility: 'r', anthropic_named: false, ...o,
});
const run = w => {
  const r = core.readAssessment(w);
  return r.problem ? r : core.applyRules(r.assessment);
};
const three = () => ({
  regulatory: dom([sig()], 'opening'),
  technical: dom([sig()], 'opening'),
  capability: dom([sig({ direction: 'closing' })], 'closing'),
});

// ── The card and the prompt ──────────────────────────────────────────────────
test('the card file is the locked card', () => {
  const sha = createHash('sha256').update(readFileSync(join(root, 'method', CARD.file))).digest('hex');
  assert.equal(sha.slice(0, 8), 'e14d8007');
  assert.equal(CARD.sha256_prefix, 'e14d8007');
  assert.equal(CARD.id, 'card-2026Q4-OctDec-v2.1');
});

test('the card text in the prompt matches the card file line for line', () => {
  const card = readFileSync(join(root, 'method', CARD.file), 'utf8').split('\n');
  const prompt = SYSTEM_PROMPT.split('\n');
  let at = 0;
  let carried = 0;
  for (const [from, to] of CARD.lines_used) {
    const block = card.slice(from - 1, to);
    const start = prompt.indexOf(block[0], at);
    assert.notEqual(start, -1, `card line ${from} not found in the prompt`);
    assert.deepEqual(prompt.slice(start, start + block.length), block, `card lines ${from}-${to}`);
    at = start + block.length;
    carried += block.length;
  }
  assert.equal(carried, 397);
});

test('the generated files are up to date with the card, template and baseline', () => {
  execFileSync(process.execPath, [join(root, 'method', 'build-prompt.mjs'), '--check'], { stdio: 'pipe' });
});

test('the baseline is the card\'s sentence and the Q3 record\'s five domain readings', () => {
  assert.ok(BASELINE.as_stated.startsWith('Baseline verdict (calendar Q3 2026, as amended): NARROWING — thin, at the Holding boundary;'));
  assert.ok(BASELINE.as_stated.endsWith('This card does not re-score it.'));
  assert.deepEqual(Object.values(BASELINE.domains).map(d => d.status),
    ['Holding, leaning advancing', 'Contested', 'Widening', 'Contested, thin', 'Concentrating']);
});

test('the prompt asks for JSON, not a tool call, and names no out-of-date wording', () => {
  assert.ok(!SYSTEM_PROMPT.includes('record_assessment'));
  assert.ok(SYSTEM_PROMPT.includes('Reply with the JSON object only'));
  assert.ok(!SYSTEM_PROMPT.includes('epistemic infrastructure'));
});

// ── The request ──────────────────────────────────────────────────────────────
test('input validation', () => {
  assert.ok(core.validateBody({ signals: { regulatory: { signal: 'x' } } }).signals);
  assert.ok(core.validateBody({ signals: { regulatory: { status: 'anything', signal: 'x' } } }).signals, 'an old tab\'s status field is ignored');
  assert.match(core.validateBody([]).error, /JSON object/);
  assert.match(core.validateBody({ signals: {}, model: 'x' }).error, /Unexpected field/);
  assert.match(core.validateBody({ signals: { bogus: {} } }).error, /Unknown domain/);
  assert.match(core.validateBody({ signals: { regulatory: { signal: 'x', extra: 1 } } }).error, /Unexpected field/);
  assert.match(core.validateBody({ signals: { regulatory: { signal: 7 } } }).error, /must be text/);
  assert.match(core.validateBody({ signals: { regulatory: { signal: 'x'.repeat(4001) } } }).error, /limit is 4,000/);
  assert.match(core.validateBody({ signals: { regulatory: { signal: '  ' } } }).error, /at least one domain/);
});

test('the visitor\'s status never reaches the model', () => {
  const { signals } = core.validateBody({ signals: { regulatory: { status: 'Critical', signal: 'x' } } });
  const message = core.buildUserMessage(signals);
  assert.ok(!message.includes('Critical'));
  assert.ok(message.includes('[Domain 3: Capability & Deployment] (key: capability)\n<<<\n(empty)\n>>>'));
});

test('the reply format stays inside the documented structured-output limits', () => {
  const json = JSON.stringify(core.OUTPUT_SCHEMA);
  assert.ok((json.match(/"anyOf"/g) ?? []).length <= 16);
  for (const k of ['minLength', 'maxLength', 'minimum', 'maximum', 'maxItems', 'minItems', 'pattern']) {
    assert.ok(!json.includes(`"${k}"`), `${k} is not supported`);
  }
  (function walk(node, path) {
    if (Array.isArray(node)) return node.forEach((x, i) => walk(x, `${path}[${i}]`));
    if (node && typeof node === 'object') {
      if (node.type === 'object') {
        assert.equal(node.additionalProperties, false, path);
        assert.deepEqual(node.required, Object.keys(node.properties), `${path}: every field is required`);
      }
      Object.entries(node).forEach(([k, v]) => walk(v, `${path}.${k}`));
    }
  })(core.OUTPUT_SCHEMA, 'schema');
});

// ── Reading the reply ────────────────────────────────────────────────────────
test('a full reply is read into the app\'s shape', () => {
  const r = run(wire(three()));
  assert.equal(r.assessment.window_status, 'Holding');
  assert.equal(r.assessment.closed_scope, null);
  assert.equal(r.assessment.jurisdictions.us_federal, null);
  assert.deepEqual(r.assessment.what_would_change, [{ if: 'c', then: 'Opening' }]);
  assert.equal(r.meta.status_withheld, null);
  assert.equal(r.meta.card_id, 'card-2026Q4-OctDec-v2.1');
  assert.equal(r.meta.basis, 'as_entered');
  assert.equal(r.meta.recall, 'recall-limited');
  assert.equal(r.meta.baseline.status, 'Narrowing');
  assert.ok(r.meta.disclosure.includes('It is not the tracker\'s assessment of record.'));
});

test('values are matched without regard to capitalisation', () => {
  const r = run(wire({ ...three(), regulatory: dom([sig({ weight: 'Partial', placement: 'IN_WINDOW' })], 'Opening') }));
  assert.equal(r.assessment.domains.regulatory.signals[0].weight, 'PARTIAL');
  assert.equal(r.assessment.domains.regulatory.direction, 'opening');
});

test('a reply with a missing or disallowed value is rejected', () => {
  assert.match(core.readAssessment({}).problem, /domains/);
  assert.match(run(wire(three(), reading({ confidence: 'high' }))).problem, /confidence/);
  assert.match(run(wire(three(), reading({ window_status: 'Fine' }))).problem, /window_status/);
});

// ── Rules the server enforces ────────────────────────────────────────────────
test('thin data: fewer than three counted domains gives no new reading', () => {
  const r = run(wire({
    regulatory: dom([sig()], 'opening'),
    technical: dom([sig({ direction: 'closing' })], 'closing'),
    capability: dom([sig({ date: '2026-08-06', placement: 'pre_window', weight: 'none' })], 'opening'),
  }));
  assert.equal(r.assessment.window_status, null);
  assert.equal(r.assessment.margin, null);
  assert.equal(r.assessment.confidence, null);
  assert.equal(r.assessment.embedding_clock, null);
  assert.equal(r.assessment.binding_authority_gap, null);
  assert.equal(r.assessment.jurisdictions, null);
  assert.equal(r.assessment.since_baseline.movement, 'not_enough_signals');
  assert.deepEqual(r.meta.status_withheld, { domains_counted: 2, required: 3 });
  assert.equal(r.assessment.domains.regulatory.signals.length, 1, 'signals are still listed');
});

test('domain states: scored, context only, no data', () => {
  const r = run(wire({
    regulatory: dom([sig()], 'opening'),
    capability: dom([sig({ date: '2026-08-06', placement: 'pre_window', weight: 'none' })], 'opening'),
  }));
  assert.deepEqual(r.meta.domain_states, {
    regulatory: 'scored', technical: 'no_data', capability: 'context_only', democratic: 'no_data', industry: 'no_data',
  });
  assert.equal(r.assessment.domains.capability.direction, null, 'a domain that is not scored has no direction');
  assert.equal(r.assessment.domains.capability.signals[0].weight, null, 'out-of-window signals carry no weight');
});

test('a signal placed in the window loses its weight if its stated date is outside it', () => {
  const r = run(wire({
    regulatory: dom([sig({ date: 'August 6, 2026' })], 'opening'),
    technical: dom([sig({ date: '' })], 'opening'),
    capability: dom([sig({ date: '2027-01-15' })], 'opening'),
  }));
  assert.equal(r.assessment.domains.regulatory.signals[0].placement, 'pre_window');
  assert.equal(r.assessment.domains.regulatory.signals[0].weight, null);
  assert.equal(r.assessment.domains.technical.signals[0].placement, 'undated');
  assert.equal(r.assessment.domains.capability.signals[0].placement, 'post_window');
  assert.equal(r.meta.adjustments.length, 3);
});

test('stated dates: only an unambiguous year and month are acted on', () => {
  assert.equal(core.placementFromDate('2026-10-01'), 'in_window');
  assert.equal(core.placementFromDate('December 2026'), 'in_window');
  assert.equal(core.placementFromDate('Sep 30, 2026'), 'pre_window');
  assert.equal(core.placementFromDate('2027-01-02'), 'post_window');
  assert.equal(core.placementFromDate('Dec 17'), null);
  assert.equal(core.placementFromDate('2026'), null);
  assert.equal(core.placementFromDate('Sep 30, 2026; Oct 5, 2026'), null);
  assert.equal(core.placementFromDate('11/03/2026'), null);
});

test('weight caps from the card', () => {
  const r = run(wire({
    regulatory: dom([sig({ verification: '?' })], 'opening'),
    technical: dom([sig({ basis: 'upr', referent: '' })], 'opening'),
    capability: dom([sig({ basis: 'catalog', referent: 'O9.9' })], 'opening'),
  }));
  assert.equal(r.assessment.domains.regulatory.signals[0].weight, 'LOW');
  assert.equal(r.assessment.domains.technical.signals[0].weight, 'LOW');
  assert.equal(r.assessment.domains.capability.signals[0].weight, 'PARTIAL');
  assert.equal(r.assessment.domains.capability.signals[0].referent, null);
  assert.equal(r.assessment.domains.regulatory.direction, null, 'LOW alone sets no direction');
  assert.equal(r.assessment.f1.domains_with_surviving_opening_hits, 1, 'LOW does not count for F-1');
  assert.equal(r.meta.adjustments.length, 5, 'three caps and two directions removed');
});

test('at most five signals per domain', () => {
  const r = run(wire({ regulatory: dom(Array.from({ length: 7 }, () => sig()), 'opening') }));
  assert.equal(r.assessment.domains.regulatory.signals.length, 5);
  assert.equal(r.assessment.domains.regulatory.signals_dropped, 2);
});

test('F-1 is counted by the server, and an undeclared override is rejected', () => {
  const ok = run(wire(three()));
  assert.deepEqual(ok.assessment.f1, { domains_with_surviving_opening_hits: 2, fires: true });
  assert.match(run(wire(three(), reading({ window_status: 'Narrowing' }))).problem, /F-1 fires/);
  const declared = run(wire(three(), reading({ window_status: 'Narrowing' }),
    { synthesis_visibility: { net_picture: 'mixed', override: 'o', discounted: 'd', why: 'w' } }));
  assert.equal(declared.assessment.window_status, 'Narrowing');
});

test('replies the server cannot repair are rejected', () => {
  assert.match(run(wire(three(), null)).problem, /no status was returned/);
  assert.match(run(wire(three(), reading({ window_status: 'Closed' }))).problem, /Closed/);
  assert.match(run(wire(three(), reading({ what_would_change: [] }))).problem, /what would change/);
  assert.match(run(wire({ regulatory: dom([sig({ weight: 'none' })], 'opening') })).problem, /no weight/);
});

test('every reversal condition reads "not searched"', () => {
  const r = run(wire({ ...three(), regulatory: dom([sig({ weight: 'PARTIAL', lenses: [{ lens: 'deferred', move: 'down', reversal_condition: 'x' }] })], 'opening') }));
  assert.equal(r.assessment.domains.regulatory.signals[0].lenses[0].searched, 'not searched');
});

// ── The endpoint, with the model call replaced ───────────────────────────────
async function post(replies, body = { signals: { regulatory: { signal: 'x' } } }) {
  const realFetch = globalThis.fetch;
  const realError = console.error;
  const realInfo = console.info;
  let calls = 0;
  let sent;
  globalThis.fetch = async (url, options) => {
    sent = JSON.parse(options.body);
    return { ok: true, status: 200, json: async () => replies[Math.min(calls++, replies.length - 1)] };
  };
  console.error = () => {};
  console.info = () => {};
  process.env.ANTHROPIC_API_KEY = 'test-key-not-real';
  const out = {};
  const res = { setHeader() {}, status(c) { out.code = c; return this; }, json(b) { out.body = b; return this; }, end() { return this; } };
  try {
    await handler({ method: 'POST', headers: { 'content-type': 'application/json' }, socket: { remoteAddress: `10.0.0.${Math.floor(Math.random() * 250)}` }, body }, res);
  } finally {
    globalThis.fetch = realFetch;
    console.error = realError;
    console.info = realInfo;
    delete process.env.ANTHROPIC_API_KEY;
  }
  return { ...out, calls, sent };
}
const good = () => ({ content: [{ type: 'text', text: JSON.stringify(wire(three())) }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } });
const garbled = () => ({ content: [{ type: 'text', text: 'not json' }], stop_reason: 'end_turn' });

test('the request sets the model, the prompt and the reply format on the server', async () => {
  const r = await post([good()]);
  assert.equal(r.code, 200);
  assert.equal(r.calls, 1);
  assert.equal(r.sent.model, 'claude-sonnet-5-5');
  assert.equal(r.sent.system, SYSTEM_PROMPT);
  assert.equal(r.sent.output_config.format.type, 'json_schema');
  assert.equal(r.sent.tool_choice, undefined);
  assert.equal(r.sent.tools, undefined);
  assert.deepEqual(Object.keys(r.body), ['assessment', 'meta']);
});

test('an unusable reply is retried once', async () => {
  const r = await post([garbled(), good()]);
  assert.equal(r.code, 200);
  assert.equal(r.calls, 2);
});

test('two unusable replies give a plain error', async () => {
  const r = await post([garbled(), garbled()]);
  assert.equal(r.code, 502);
  assert.equal(r.calls, 2);
  assert.equal(r.body.error.code, 'upstream_malformed');
  assert.ok(!JSON.stringify(r.body).includes('not json'), 'upstream text is not passed to the caller');
});

test('a reply cut off at the token limit is not retried', async () => {
  const r = await post([{ content: [{ type: 'text', text: '{"a"' }], stop_reason: 'max_tokens' }, good()]);
  assert.equal(r.calls, 1);
  assert.equal(r.body.error.code, 'upstream_truncated');
});

test('a bad request never reaches the model', async () => {
  const r = await post([good()], { signals: { regulatory: { signal: '' } } });
  assert.equal(r.code, 400);
  assert.equal(r.calls, 0);
});
