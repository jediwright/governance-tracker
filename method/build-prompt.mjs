// Builds api/_method.js (for the server) and gwt-app/src/method.generated.ts (for
// the app) from the locked card, the prompt template and the baseline.
//
//   node method/build-prompt.mjs          writes both files
//   node method/build-prompt.mjs --check  exits 1 if either file is out of date
//
// The card file is the locked card, byte for byte. Nothing here edits it. The
// template pulls card lines in by number, so the prompt cannot drift from the card
// without this script or the template changing.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CARD_FILE = 'card-2026Q4-OctDec-v2_1.md';
const CARD_SHA256_PREFIX = 'e14d8007';
const OUT = join(here, '..', 'api', '_method.js');
const APP_OUT = join(here, '..', 'gwt-app', 'src', 'method.generated.ts');

const cardRaw = readFileSync(join(here, CARD_FILE));
const sha = createHash('sha256').update(cardRaw).digest('hex');
if (!sha.startsWith(CARD_SHA256_PREFIX)) {
  throw new Error(`${CARD_FILE} has sha256 ${sha.slice(0, 8)}; expected ${CARD_SHA256_PREFIX}. The card file has changed.`);
}
const card = cardRaw.toString('utf8').split('\n');

function cardLines(from, to) {
  if (from < 1 || to > card.length || from > to) throw new Error(`Bad card range ${from}-${to}.`);
  return card.slice(from - 1, to);
}

function find(prefix) {
  const line = card.find(l => l.startsWith(prefix));
  if (line === undefined) throw new Error(`Card line starting "${prefix}" not found.`);
  return line.slice(prefix.length).trim();
}

const template = readFileSync(join(here, 'prompt-template.txt'), 'utf8').replace(/\n$/, '').split('\n');
const promptLines = [];
const cardLinesUsed = [];
for (const line of template) {
  const m = line.match(/^\{\{CARD (\d+)-(\d+)\}\}$/);
  if (!m) { promptLines.push(line); continue; }
  const from = Number(m[1]);
  const to = Number(m[2]);
  promptLines.push(...cardLines(from, to));
  cardLinesUsed.push([from, to]);
}
const systemPrompt = promptLines.join('\n');

// The baseline sentence, word for word from the card's carry-forward block.
const start = card.findIndex(l => l.trimStart().startsWith('Baseline verdict (calendar Q3 2026, as amended):'));
if (start === -1) throw new Error('Baseline verdict paragraph not found in the card.');
const paragraph = [];
for (let i = start; i < card.length; i++) {
  paragraph.push(card[i].trim());
  if (card[i].includes('This card does not re-score it.')) break;
}
const asStated = paragraph.join(' ');

const baselineFile = JSON.parse(readFileSync(join(here, 'baseline.json'), 'utf8'));
// The prompt's BASELINE BY DOMAIN block and baseline.json must say the same thing.
for (const [id, d] of Object.entries(baselineFile.domains)) {
  const hit = promptLines.some(l => /^ {2}D[1-5] /.test(l)
    && l.includes(d.status)
    && l.toLowerCase().includes(`trend: ${d.trend.toLowerCase()}`));
  if (!hit) throw new Error(`baseline.json and the prompt template disagree on the ${id} baseline.`);
}
const baseline = {
  status: baselineFile.status,
  margin: baselineFile.margin,
  confidence: baselineFile.confidence,
  period: baselineFile.period,
  as_stated: asStated,
  caveat: baselineFile.caveat,
  sources: baselineFile.sources,
  domains: baselineFile.domains,
};

const card_ = {
  id: find('Card ID:'),
  file: CARD_FILE,
  sha256_prefix: CARD_SHA256_PREFIX,
  window: { start: '2026-10-01', end: '2026-12-31' },
  lines_used: cardLinesUsed,
};
if (!find('Governs:').startsWith('Oct 1 – Dec 31, 2026')) throw new Error('The card\'s "Governs" line does not match the window in this script.');

const out = `// GENERATED FILE. Do not edit by hand.
// Built by method/build-prompt.mjs from method/${CARD_FILE} (sha256 prefix
// ${CARD_SHA256_PREFIX}), method/prompt-template.txt and method/baseline.json.
// To change it, change those files and run: node method/build-prompt.mjs

export const CARD = ${JSON.stringify(card_, null, 2)};

export const BASELINE = ${JSON.stringify(baseline, null, 2)};

export const SYSTEM_PROMPT = ${JSON.stringify(systemPrompt)};
`;

// The app shows the baseline before any run, so it needs the same record the
// server uses. It gets the card's identity and the baseline, not the prompt.
const appOut = `// GENERATED FILE. Do not edit by hand.
// Built by method/build-prompt.mjs from method/${CARD_FILE} (sha256 prefix
// ${CARD_SHA256_PREFIX}) and method/baseline.json.
// To change it, change those files and run: node method/build-prompt.mjs

export const CARD = ${JSON.stringify(card_, null, 2)} as const;

export const BASELINE = ${JSON.stringify(baseline, null, 2)} as const;
`;

const outputs = [
  { path: OUT, name: 'api/_method.js', content: out },
  { path: APP_OUT, name: 'gwt-app/src/method.generated.ts', content: appOut },
];

if (process.argv.includes('--check')) {
  let stale = false;
  for (const o of outputs) {
    let current = '';
    try { current = readFileSync(o.path, 'utf8'); } catch { /* missing counts as out of date */ }
    if (current !== o.content) {
      console.error(`${o.name} is out of date. Run: node method/build-prompt.mjs`);
      stale = true;
    } else {
      console.log(`${o.name} is up to date.`);
    }
  }
  if (stale) process.exit(1);
} else {
  for (const o of outputs) writeFileSync(o.path, o.content);
  console.log(`Wrote api/_method.js and gwt-app/src/method.generated.ts: prompt ${promptLines.length} lines, ${systemPrompt.length} characters.`);
}
